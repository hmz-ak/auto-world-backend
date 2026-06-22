import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';

@Injectable()
export class AuditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async findAll(page = 1, limit = 20) {
    const [logs, total] = await this.auditRepository.findAndCount({
      relations: { linkedOrder: true, items: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return buildPaginatedResult(logs, total, page, limit);
  }

  async findOne(id: number): Promise<AuditLog> {
    const log = await this.auditRepository.findOne({
      where: { id },
      relations: { linkedOrder: true, items: { inventoryItem: true } }
    });
    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }
    return log;
  }

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
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
      ? await this.purchaseOrdersService.findOne(dto.linkedOrderId)
      : null;

    return this.dataSource.transaction(async (manager) => {
      const auditLog = manager.create(AuditLog, {
        batchNumber: await this.generateBatchNumber(dto.productionDate),
        productProduced: dto.productProduced,
        quantityProduced: dto.quantityProduced,
        productionDate: dto.productionDate,
        linkedOrder,
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

      return this.findOne(savedLog.id);
    });
  }

  async update(id: number, dto: UpdateAuditLogDto): Promise<AuditLog> {
    const log = await this.findOne(id);
    log.notes = dto.notes ?? log.notes;
    return this.auditRepository.save(log);
  }

  remove(): never {
    throw new ForbiddenException('Audit logs are permanent and cannot be deleted');
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
