import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { InventoryCategory, InventoryUnit } from '../inventory/constants/inventory.constants';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CLIENT_KAMANI_WEIGHTS } from './constants/manufacturing.constants';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { CreateManufacturingRecordDto } from './dto/create-manufacturing-record.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog, ManufacturingItemSnapshot } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly clientsService: ClientsService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async findAll(page = 1, limit = 20): Promise<PaginatedResult<AuditLogResponseDto>> {
    const [logs, total] = await this.auditRepository.findAndCount({
      relations: { linkedOrder: true, client: true, items: { inventoryItem: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return buildPaginatedResult(logs.map((log) => this.mapLog(log)), total, page, limit);
  }

  async findManufacturingAll(page = 1, limit = 20): Promise<PaginatedResult<AuditLogResponseDto>> {
    const [logs, total] = await this.auditRepository.findAndCount({
      where: { client: Not(IsNull()) },
      relations: { linkedOrder: true, client: true, items: { inventoryItem: true } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return buildPaginatedResult(logs.map((log) => this.mapLog(log)), total, page, limit);
  }

  async findOne(id: number): Promise<AuditLogResponseDto> {
    const log = await this.findEntityById(id);
    return this.mapLog(log);
  }

  async findEntityById(id: number): Promise<AuditLog> {
    const log = await this.auditRepository.findOne({
      where: { id },
      relations: { linkedOrder: true, client: true, items: { inventoryItem: true } }
    });
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async create(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const checkedItems = await Promise.all(
      dto.items.map(async (item) => ({
        request: item,
        inventoryItem: await this.inventoryService.assertAvailable(
          item.inventoryItemId,
          item.quantityConsumed
        )
      }))
    );
    const linkedOrder = dto.linkedOrderId
      ? await this.purchaseOrdersService.findEntityById(dto.linkedOrderId)
      : null;

    const savedLogId = await this.dataSource.transaction(async (manager) => {
      const auditLog = manager.create(AuditLog, {
        batchNumber: await this.generateBatchNumber(dto.productionDate),
        productProduced: dto.productProduced,
        quantityProduced: dto.quantityProduced,
        productionDate: dto.productionDate,
        linkedOrder,
        client: null,
        manufacturingItems: null,
        totalWeightConsumed: 0,
        notes: dto.notes ?? null
      });
      const savedLog = await manager.save(auditLog);

      for (const checkedItem of checkedItems) {
        const inventoryItem = checkedItem.inventoryItem;
        const availableQuantity = toMoney(
          Number(inventoryItem.availableQuantity) - checkedItem.request.quantityConsumed
        );
        const consumedQuantity = toMoney(
          Number(inventoryItem.consumedQuantity) + checkedItem.request.quantityConsumed
        );
        await manager.update(InventoryItem, inventoryItem.id, {
          availableQuantity,
          consumedQuantity,
          status: this.inventoryService.computeStatus(availableQuantity, Number(inventoryItem.totalQuantity))
        });
        await manager.save(
          manager.create(AuditLogItem, {
            auditLog: savedLog,
            inventoryItem,
            quantityConsumed: checkedItem.request.quantityConsumed
          })
        );
      }

      return savedLog.id;
    });

    return this.findOne(savedLogId);
  }

  async createBatch(dto: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    return this.create(dto);
  }

  async createManufacturingRecord(dto: CreateManufacturingRecordDto): Promise<AuditLogResponseDto> {
    const client = await this.clientsService.findEntityById(dto.clientId);
    const rawMaterial = await this.inventoryService.assertAvailable(dto.rawMaterialInventoryItemId, 0);

    if (rawMaterial.category !== InventoryCategory.RAW_MATERIAL) {
      throw new BadRequestException('Selected inventory item must be a raw material');
    }

    if (rawMaterial.unit !== InventoryUnit.KG) {
      throw new BadRequestException('Raw material consumption must use inventory measured in KG');
    }

    const manufacturingItems = this.buildManufacturingItems(client.name, dto.kamaniItems);
    const totalWeightConsumed = toMoney(
      manufacturingItems.reduce((total, item) => total + item.totalWeight, 0)
    );

    await this.inventoryService.assertAvailable(dto.rawMaterialInventoryItemId, totalWeightConsumed);

    const savedLogId = await this.dataSource.transaction(async (manager) => {
      const auditLog = manager.create(AuditLog, {
        batchNumber: await this.generateBatchNumber(dto.productionDate),
        productProduced: `${client.name} Kamani`,
        quantityProduced: manufacturingItems.reduce((total, item) => total + item.quantity, 0),
        productionDate: dto.productionDate,
        linkedOrder: null,
        client,
        manufacturingItems,
        totalWeightConsumed,
        notes: dto.notes ?? null
      });
      const savedLog = await manager.save(auditLog);

      const availableQuantity = toMoney(Number(rawMaterial.availableQuantity) - totalWeightConsumed);
      const consumedQuantity = toMoney(Number(rawMaterial.consumedQuantity) + totalWeightConsumed);
      await manager.update(InventoryItem, rawMaterial.id, {
        availableQuantity,
        consumedQuantity,
        status: this.inventoryService.computeStatus(availableQuantity, Number(rawMaterial.totalQuantity))
      });
      await manager.save(
        manager.create(AuditLogItem, {
          auditLog: savedLog,
          inventoryItem: rawMaterial,
          quantityConsumed: totalWeightConsumed
        })
      );

      return savedLog.id;
    });

    return this.findOne(savedLogId);
  }

  async update(id: number, dto: UpdateAuditLogDto): Promise<AuditLogResponseDto> {
    const log = await this.findEntityById(id);
    log.notes = dto.notes ?? log.notes;
    const savedLog = await this.auditRepository.save(log);
    return this.findOne(savedLog.id);
  }

  remove(): never {
    throw new ForbiddenException('Audit logs are permanent and cannot be deleted');
  }

  private mapLog(log: AuditLog): AuditLogResponseDto {
    return {
      id: log.id,
      batchNumber: log.batchNumber,
      productProduced: log.productProduced,
      quantityProduced: Number(log.quantityProduced),
      productionDate: log.productionDate as unknown as Date,
      linkedOrderId: log.linkedOrder?.id ?? null,
      linkedOrderNumber: log.linkedOrder?.orderNumber ?? null,
      clientId: log.client?.id ?? null,
      clientName: log.client?.name ?? null,
      manufacturingItems: (log.manufacturingItems ?? []).map((item) => ({
        kamaniType: item.kamaniType,
        quantity: Number(item.quantity),
        unitWeight: Number(item.unitWeight),
        totalWeight: Number(item.totalWeight)
      })),
      totalWeightConsumed: Number(log.totalWeightConsumed ?? 0),
      notes: log.notes,
      consumedItems: (log.items ?? []).map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItem.id,
        inventoryItemName: item.inventoryItem.name,
        rawMaterialSize: item.inventoryItem.rawMaterialSize,
        unit: item.inventoryItem.unit,
        quantityConsumed: Number(item.quantityConsumed)
      })),
      createdAt: log.createdAt
    };
  }

  private buildManufacturingItems(
    clientName: string,
    requestedItems: CreateManufacturingRecordDto['kamaniItems']
  ): ManufacturingItemSnapshot[] {
    const clientWeights = CLIENT_KAMANI_WEIGHTS[clientName];
    if (!clientWeights) {
      throw new BadRequestException(`No kamani weight table is configured for ${clientName}`);
    }

    return requestedItems.map((requestedItem) => {
      const spec = clientWeights.find((item) => item.kamaniType === requestedItem.kamaniType);
      if (!spec) {
        throw new BadRequestException(`${requestedItem.kamaniType} is not configured for ${clientName}`);
      }

      return {
        kamaniType: requestedItem.kamaniType,
        quantity: requestedItem.quantity,
        unitWeight: spec.weightKg,
        totalWeight: toMoney(spec.weightKg * requestedItem.quantity)
      };
    });
  }

  private async generateBatchNumber(productionDate: string): Promise<string> {
    const compactDate = productionDate.replace(/-/g, '');
    const count = await this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.batchNumber LIKE :prefix', { prefix: `BATCH-${compactDate}-%` })
      .getCount();
    return `BATCH-${compactDate}-${String(count + 1).padStart(4, '0')}`;
  }
}
