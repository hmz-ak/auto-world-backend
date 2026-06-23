import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import { CLIENT_KAMANI_WEIGHTS } from '../common/constants/kamani.constants';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { toMoney } from '../common/utils/money.util';
import { buildPaginatedResult } from '../common/utils/pagination.util';
import { InventoryCategory, InventoryUnit } from '../inventory/constants/inventory.constants';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { PurchaseOrderStatus } from '../purchase-orders/constants/purchase-order.constants';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import {
  MANUFACTURING_PROCESS_PHASES,
  ManufacturingProcessStepStatus,
  ManufacturingRecordStatus
} from './constants/manufacturing.constants';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { CreateManufacturingProcessSheetDto } from './dto/create-manufacturing-process-sheet.dto';
import { CreateManufacturingRecordDto } from './dto/create-manufacturing-record.dto';
import { ManufacturingProcessSheetResponseDto } from './dto/manufacturing-process-sheet-response.dto';
import { UpdateManufacturingProcessStepDto } from './dto/update-manufacturing-process-step.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogItem } from './entities/audit-log-item.entity';
import {
  AuditLog,
  ManufacturingItemSnapshot,
  ManufacturingProcessStepSnapshot
} from './entities/audit-log.entity';
import { ManufacturingProcessSheet } from './entities/manufacturing-process-sheet.entity';

@Injectable()
export class AuditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryService: InventoryService,
    private readonly clientsService: ClientsService,
    @Inject(forwardRef(() => PurchaseOrdersService))
    private readonly purchaseOrdersService: PurchaseOrdersService,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(ManufacturingProcessSheet)
    private readonly processSheetRepository: Repository<ManufacturingProcessSheet>
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
        manufacturingStatus: ManufacturingRecordStatus.PENDING,
        processSteps: null,
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

    this.assertRawMaterialCanBeConsumed(rawMaterial);

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
        manufacturingStatus: ManufacturingRecordStatus.PENDING,
        processSteps: this.createDefaultProcessSteps(),
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

  async createManufacturingRecordFromPurchaseOrder(order: PurchaseOrder): Promise<AuditLogResponseDto> {
    const existing = await this.auditRepository.findOne({
      where: { linkedOrder: { id: order.id } },
      relations: { linkedOrder: true, client: true, items: { inventoryItem: true } }
    });

    if (existing) {
      return this.mapLog(existing);
    }

    const manufacturingItems = this.buildManufacturingItems(
      order.client.name,
      (order.items ?? []).map((item) => ({
        kamaniType: item.productName,
        quantity: Number(item.quantity)
      }))
    );
    const totalWeightConsumed = toMoney(
      manufacturingItems.reduce((total, item) => total + item.totalWeight, 0)
    );
    const auditLog = this.auditRepository.create({
      batchNumber: await this.generateBatchNumber(order.orderDate),
      productProduced: `${order.client.name} Kamani`,
      quantityProduced: manufacturingItems.reduce((total, item) => total + item.quantity, 0),
      productionDate: order.orderDate,
      linkedOrder: order,
      client: order.client,
      manufacturingItems,
      totalWeightConsumed,
      manufacturingStatus: ManufacturingRecordStatus.PENDING,
      processSteps: this.createDefaultProcessSteps(),
      notes: `Auto-generated from purchase order ${order.orderNumber}`
    });
    const savedLog = await this.auditRepository.save(auditLog);
    return this.findOne(savedLog.id);
  }

  async update(id: number, dto: UpdateAuditLogDto): Promise<AuditLogResponseDto> {
    const log = await this.findEntityById(id);
    log.notes = dto.notes ?? log.notes;
    const savedLog = await this.auditRepository.save(log);
    return this.findOne(savedLog.id);
  }

  async updateManufacturingProcessStep(
    id: number,
    dto: UpdateManufacturingProcessStepDto
  ): Promise<AuditLogResponseDto> {
    const log = await this.findEntityById(id);
    if (!log.client) {
      throw new BadRequestException('Process sheet is only available for manufacturing records');
    }

    const now = new Date().toISOString();
    const processSteps = this.ensureProcessSteps(log.processSteps);
    log.processSteps = this.applySequentialProcessTransition(processSteps, dto, now);
    log.manufacturingStatus = this.resolveManufacturingStatus(log.processSteps);
    const rawMaterial = await this.resolveRawMaterialForProcessStart(log, processSteps, dto);
    const savedLogId = rawMaterial
      ? await this.saveProcessStepAndConsumeRawMaterial(log, rawMaterial)
      : (await this.auditRepository.save(log)).id;
    const savedLog = await this.findEntityById(savedLogId);
    await this.syncLinkedPurchaseOrderStatus(savedLog);
    return this.mapLog(savedLog);
  }

  async findManufacturingProcessSheets(
    manufacturingRecordId: number
  ): Promise<ManufacturingProcessSheetResponseDto[]> {
    await this.findEntityById(manufacturingRecordId);
    const processSheets = await this.processSheetRepository.find({
      where: { manufacturingRecord: { id: manufacturingRecordId } },
      relations: {
        manufacturingRecord: { linkedOrder: true, client: true },
        consumedItems: { inventoryItem: true }
      },
      order: { createdAt: 'ASC' }
    });
    return processSheets.map((processSheet) => this.mapProcessSheet(processSheet));
  }

  async createManufacturingProcessSheet(
    manufacturingRecordId: number,
    dto: CreateManufacturingProcessSheetDto
  ): Promise<ManufacturingProcessSheetResponseDto> {
    const manufacturingRecord = await this.findManufacturingRecordWithSheets(manufacturingRecordId);
    if (!manufacturingRecord.client) {
      throw new BadRequestException('Process sheets can only be created for manufacturing records');
    }

    this.assertProcessSheetQuantitiesWithinRemaining(manufacturingRecord, dto.kamaniItems);
    const manufacturingItems = this.buildManufacturingItems(manufacturingRecord.client.name, dto.kamaniItems);
    const processSheet = this.processSheetRepository.create({
      sheetNumber: await this.generateProcessSheetNumber(dto.productionDate),
      manufacturingRecord,
      productionDate: dto.productionDate,
      manufacturingItems,
      quantityProduced: manufacturingItems.reduce((total, item) => total + item.quantity, 0),
      totalWeightConsumed: toMoney(manufacturingItems.reduce((total, item) => total + item.totalWeight, 0)),
      manufacturingStatus: ManufacturingRecordStatus.PENDING,
      processSteps: this.createDefaultProcessSteps(),
      notes: dto.notes ?? null
    });
    const savedProcessSheet = await this.processSheetRepository.save(processSheet);
    return this.findManufacturingProcessSheet(savedProcessSheet.id);
  }

  async findManufacturingProcessSheet(id: number): Promise<ManufacturingProcessSheetResponseDto> {
    return this.mapProcessSheet(await this.findProcessSheetEntityById(id));
  }

  async updateManufacturingProcessSheetStep(
    id: number,
    dto: UpdateManufacturingProcessStepDto
  ): Promise<ManufacturingProcessSheetResponseDto> {
    const processSheet = await this.findProcessSheetEntityById(id);
    const now = new Date().toISOString();
    const processSteps = this.ensureProcessSteps(processSheet.processSteps);
    processSheet.processSteps = this.applySequentialProcessTransition(processSteps, dto, now);
    processSheet.manufacturingStatus = this.resolveManufacturingStatus(processSheet.processSteps);
    const rawMaterial = await this.resolveRawMaterialForProcessSheetStart(processSheet, processSteps, dto);
    const savedProcessSheetId = rawMaterial
      ? await this.saveProcessSheetStepAndConsumeRawMaterial(processSheet, rawMaterial)
      : (await this.processSheetRepository.save(processSheet)).id;
    const savedProcessSheet = await this.findProcessSheetEntityById(savedProcessSheetId);
    const manufacturingRecord = await this.refreshManufacturingRecordStatus(savedProcessSheet.manufacturingRecord.id);
    await this.syncLinkedPurchaseOrderStatus(manufacturingRecord);
    return this.mapProcessSheet(savedProcessSheet);
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
      manufacturingStatus: log.manufacturingStatus ?? ManufacturingRecordStatus.PENDING,
      processSteps: this.ensureProcessSteps(log.processSteps).map((step) => ({
        phase: step.phase,
        label: step.label,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt
      })),
      isReadyForReceipt: this.resolveManufacturingStatus(this.ensureProcessSteps(log.processSteps)) === ManufacturingRecordStatus.COMPLETED,
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

  private mapProcessSheet(processSheet: ManufacturingProcessSheet): ManufacturingProcessSheetResponseDto {
    return {
      id: processSheet.id,
      sheetNumber: processSheet.sheetNumber,
      manufacturingRecordId: processSheet.manufacturingRecord.id,
      manufacturingRecordNumber: processSheet.manufacturingRecord.batchNumber,
      linkedOrderId: processSheet.manufacturingRecord.linkedOrder?.id ?? null,
      linkedOrderNumber: processSheet.manufacturingRecord.linkedOrder?.orderNumber ?? null,
      clientName: processSheet.manufacturingRecord.client?.name ?? null,
      productionDate: processSheet.productionDate as unknown as Date,
      manufacturingItems: processSheet.manufacturingItems.map((item) => ({
        kamaniType: item.kamaniType,
        quantity: Number(item.quantity),
        unitWeight: Number(item.unitWeight),
        totalWeight: Number(item.totalWeight)
      })),
      quantityProduced: Number(processSheet.quantityProduced),
      totalWeightConsumed: Number(processSheet.totalWeightConsumed),
      manufacturingStatus: processSheet.manufacturingStatus,
      processSteps: this.ensureProcessSteps(processSheet.processSteps).map((step) => ({
        phase: step.phase,
        label: step.label,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt
      })),
      isReadyForReceipt:
        this.resolveManufacturingStatus(this.ensureProcessSteps(processSheet.processSteps)) ===
        ManufacturingRecordStatus.COMPLETED,
      consumedItems: (processSheet.consumedItems ?? []).map((item) => ({
        id: item.id,
        inventoryItemId: item.inventoryItem.id,
        inventoryItemName: item.inventoryItem.name,
        rawMaterialSize: item.inventoryItem.rawMaterialSize,
        unit: item.inventoryItem.unit,
        quantityConsumed: Number(item.quantityConsumed)
      })),
      notes: processSheet.notes,
      createdAt: processSheet.createdAt
    };
  }

  private async findManufacturingRecordWithSheets(id: number): Promise<AuditLog> {
    const log = await this.auditRepository.findOne({
      where: { id },
      relations: {
        linkedOrder: true,
        client: true,
        items: { inventoryItem: true },
        processSheets: true
      }
    });
    if (!log) {
      throw new NotFoundException(`Manufacturing record with ID ${id} not found`);
    }
    return log;
  }

  private async findProcessSheetEntityById(id: number): Promise<ManufacturingProcessSheet> {
    const processSheet = await this.processSheetRepository.findOne({
      where: { id },
      relations: {
        manufacturingRecord: { linkedOrder: true, client: true },
        consumedItems: { inventoryItem: true }
      }
    });
    if (!processSheet) {
      throw new NotFoundException(`Manufacturing process sheet with ID ${id} not found`);
    }
    return processSheet;
  }

  private createDefaultProcessSteps(): ManufacturingProcessStepSnapshot[] {
    return MANUFACTURING_PROCESS_PHASES.map((step) => ({
      phase: step.phase,
      label: step.label,
      status: ManufacturingProcessStepStatus.PENDING,
      startedAt: null,
      completedAt: null
    }));
  }

  private ensureProcessSteps(
    processSteps: ManufacturingProcessStepSnapshot[] | null | undefined
  ): ManufacturingProcessStepSnapshot[] {
    if (!processSteps?.length) {
      return this.createDefaultProcessSteps();
    }

    const existingByPhase = new Map(processSteps.map((step) => [step.phase, step]));
    return MANUFACTURING_PROCESS_PHASES.map((step) => {
      const existing = existingByPhase.get(step.phase);
      return {
        phase: step.phase,
        label: step.label,
        status: existing?.status ?? ManufacturingProcessStepStatus.PENDING,
        startedAt: existing?.startedAt ?? null,
        completedAt: existing?.completedAt ?? null
      };
    });
  }

  private assertProcessSheetQuantitiesWithinRemaining(
    manufacturingRecord: AuditLog,
    requestedItems: CreateManufacturingProcessSheetDto['kamaniItems']
  ): void {
    const requestedByType = new Map<string, number>();
    for (const item of requestedItems) {
      requestedByType.set(item.kamaniType, Number(requestedByType.get(item.kamaniType) ?? 0) + item.quantity);
    }
    const allocatedByType = this.sumProcessSheetQuantities(manufacturingRecord.processSheets ?? []);

    for (const parentItem of manufacturingRecord.manufacturingItems ?? []) {
      const requestedQuantity = requestedByType.get(parentItem.kamaniType) ?? 0;
      const allocatedQuantity = allocatedByType.get(parentItem.kamaniType) ?? 0;
      const remainingQuantity = Number(parentItem.quantity) - allocatedQuantity;
      if (requestedQuantity > remainingQuantity) {
        throw new BadRequestException(
          `${parentItem.kamaniType} exceeds remaining quantity. Remaining: ${remainingQuantity}`
        );
      }
    }

    for (const requestedItem of requestedItems) {
      const existsInRecord = (manufacturingRecord.manufacturingItems ?? []).some(
        (item) => item.kamaniType === requestedItem.kamaniType
      );
      if (!existsInRecord) {
        throw new BadRequestException(`${requestedItem.kamaniType} is not part of this manufacturing record`);
      }
    }
  }

  private sumProcessSheetQuantities(processSheets: ManufacturingProcessSheet[]): Map<string, number> {
    const quantitiesByType = new Map<string, number>();
    for (const processSheet of processSheets) {
      for (const item of processSheet.manufacturingItems ?? []) {
        quantitiesByType.set(
          item.kamaniType,
          Number(quantitiesByType.get(item.kamaniType) ?? 0) + Number(item.quantity)
        );
      }
    }
    return quantitiesByType;
  }

  private async resolveRawMaterialForProcessSheetStart(
    processSheet: ManufacturingProcessSheet,
    processSteps: ManufacturingProcessStepSnapshot[],
    dto: UpdateManufacturingProcessStepDto
  ): Promise<InventoryItem | null> {
    if (!this.shouldConsumeRawMaterialOnProcessSheetStart(processSheet, processSteps, dto)) {
      return null;
    }

    if (!dto.rawMaterialInventoryItemId) {
      throw new BadRequestException('Select raw material before starting manufacturing');
    }

    const rawMaterial = await this.inventoryService.assertAvailable(
      dto.rawMaterialInventoryItemId,
      Number(processSheet.totalWeightConsumed)
    );
    this.assertRawMaterialCanBeConsumed(rawMaterial);
    return rawMaterial;
  }

  private shouldConsumeRawMaterialOnProcessSheetStart(
    processSheet: ManufacturingProcessSheet,
    processSteps: ManufacturingProcessStepSnapshot[],
    dto: UpdateManufacturingProcessStepDto
  ): boolean {
    const firstPhase = MANUFACTURING_PROCESS_PHASES[0]?.phase;
    const currentStep = processSteps.find((step) => step.phase === dto.phase);
    const hasConsumedInventory = (processSheet.consumedItems ?? []).length > 0;
    return Boolean(
      !hasConsumedInventory &&
        dto.phase === firstPhase &&
        dto.status === ManufacturingProcessStepStatus.IN_PROGRESS &&
        currentStep?.status === ManufacturingProcessStepStatus.PENDING
    );
  }

  private async saveProcessSheetStepAndConsumeRawMaterial(
    processSheet: ManufacturingProcessSheet,
    rawMaterial: InventoryItem
  ): Promise<number> {
    const quantityToConsume = Number(processSheet.totalWeightConsumed);
    if (quantityToConsume <= 0) {
      throw new BadRequestException('Process sheet has no raw material weight to consume');
    }

    return this.dataSource.transaction(async (manager) => {
      const savedProcessSheet = await manager.save(ManufacturingProcessSheet, processSheet);
      await this.consumeRawMaterial(
        manager,
        savedProcessSheet.manufacturingRecord,
        rawMaterial,
        quantityToConsume,
        savedProcessSheet
      );
      return savedProcessSheet.id;
    });
  }

  private async refreshManufacturingRecordStatus(id: number): Promise<AuditLog> {
    const manufacturingRecord = await this.findManufacturingRecordWithSheets(id);
    const completedQuantity = (manufacturingRecord.processSheets ?? [])
      .filter((processSheet) => processSheet.manufacturingStatus === ManufacturingRecordStatus.COMPLETED)
      .reduce((total, processSheet) => total + Number(processSheet.quantityProduced), 0);
    const hasStartedSheet = (manufacturingRecord.processSheets ?? []).some(
      (processSheet) => processSheet.manufacturingStatus !== ManufacturingRecordStatus.PENDING
    );

    if (completedQuantity >= Number(manufacturingRecord.quantityProduced)) {
      manufacturingRecord.manufacturingStatus = ManufacturingRecordStatus.COMPLETED;
    } else if (hasStartedSheet) {
      manufacturingRecord.manufacturingStatus = ManufacturingRecordStatus.IN_PROGRESS;
    } else {
      manufacturingRecord.manufacturingStatus = ManufacturingRecordStatus.PENDING;
    }

    return this.auditRepository.save(manufacturingRecord);
  }

  private async resolveRawMaterialForProcessStart(
    log: AuditLog,
    processSteps: ManufacturingProcessStepSnapshot[],
    dto: UpdateManufacturingProcessStepDto
  ): Promise<InventoryItem | null> {
    if (!this.shouldConsumeRawMaterialOnProcessStart(log, processSteps, dto)) {
      return null;
    }

    if (!dto.rawMaterialInventoryItemId) {
      throw new BadRequestException('Select raw material before starting manufacturing');
    }

    const rawMaterial = await this.inventoryService.assertAvailable(
      dto.rawMaterialInventoryItemId,
      Number(log.totalWeightConsumed)
    );
    this.assertRawMaterialCanBeConsumed(rawMaterial);
    return rawMaterial;
  }

  private shouldConsumeRawMaterialOnProcessStart(
    log: AuditLog,
    processSteps: ManufacturingProcessStepSnapshot[],
    dto: UpdateManufacturingProcessStepDto
  ): boolean {
    const firstPhase = MANUFACTURING_PROCESS_PHASES[0]?.phase;
    const currentStep = processSteps.find((step) => step.phase === dto.phase);
    const hasConsumedInventory = (log.items ?? []).length > 0;
    return Boolean(
      !hasConsumedInventory &&
        dto.phase === firstPhase &&
        dto.status === ManufacturingProcessStepStatus.IN_PROGRESS &&
        currentStep?.status === ManufacturingProcessStepStatus.PENDING
    );
  }

  private async saveProcessStepAndConsumeRawMaterial(
    log: AuditLog,
    rawMaterial: InventoryItem
  ): Promise<number> {
    const quantityToConsume = Number(log.totalWeightConsumed);
    if (quantityToConsume <= 0) {
      throw new BadRequestException('Manufacturing record has no raw material weight to consume');
    }

    return this.dataSource.transaction(async (manager) => {
      const savedLog = await manager.save(AuditLog, log);
      await this.consumeRawMaterial(manager, savedLog, rawMaterial, quantityToConsume);
      return savedLog.id;
    });
  }

  private async consumeRawMaterial(
    manager: EntityManager,
    auditLog: AuditLog,
    rawMaterial: InventoryItem,
    quantityToConsume: number,
    processSheet: ManufacturingProcessSheet | null = null
  ): Promise<void> {
    const availableQuantity = toMoney(Number(rawMaterial.availableQuantity) - quantityToConsume);
    const consumedQuantity = toMoney(Number(rawMaterial.consumedQuantity) + quantityToConsume);
    await manager.update(InventoryItem, rawMaterial.id, {
      availableQuantity,
      consumedQuantity,
      status: this.inventoryService.computeStatus(availableQuantity, Number(rawMaterial.totalQuantity))
    });
    await manager.save(
      manager.create(AuditLogItem, {
        auditLog,
        inventoryItem: rawMaterial,
        processSheet,
        quantityConsumed: quantityToConsume
      })
    );
  }

  private applySequentialProcessTransition(
    processSteps: ManufacturingProcessStepSnapshot[],
    dto: UpdateManufacturingProcessStepDto,
    now: string
  ): ManufacturingProcessStepSnapshot[] {
    const stepIndex = processSteps.findIndex((step) => step.phase === dto.phase);
    if (stepIndex === -1) {
      throw new BadRequestException(`Unknown manufacturing phase: ${dto.phase}`);
    }

    const step = processSteps[stepIndex];
    const previousStepsCompleted = processSteps
      .slice(0, stepIndex)
      .every((previousStep) => previousStep.status === ManufacturingProcessStepStatus.COMPLETED);
    if (!previousStepsCompleted) {
      throw new BadRequestException('Previous manufacturing phases must be completed first');
    }

    if (step.status === ManufacturingProcessStepStatus.COMPLETED) {
      throw new BadRequestException(`${step.label} is already completed`);
    }

    const anotherStepInProgress = processSteps.some(
      (processStep, index) =>
        index !== stepIndex && processStep.status === ManufacturingProcessStepStatus.IN_PROGRESS
    );

    if (step.status === ManufacturingProcessStepStatus.PENDING) {
      if (dto.status !== ManufacturingProcessStepStatus.IN_PROGRESS) {
        throw new BadRequestException('Pending manufacturing phases can only be started');
      }

      if (anotherStepInProgress) {
        throw new BadRequestException('Complete the current in-progress phase before starting another phase');
      }

      return processSteps.map((processStep, index) =>
        index === stepIndex
          ? {
              ...processStep,
              status: ManufacturingProcessStepStatus.IN_PROGRESS,
              startedAt: processStep.startedAt ?? now,
              completedAt: null
            }
          : processStep
      );
    }

    if (step.status === ManufacturingProcessStepStatus.IN_PROGRESS) {
      if (dto.status !== ManufacturingProcessStepStatus.COMPLETED) {
        throw new BadRequestException('In-progress manufacturing phases can only be completed');
      }

      return processSteps.map((processStep, index) =>
        index === stepIndex
          ? {
              ...processStep,
              status: ManufacturingProcessStepStatus.COMPLETED,
              startedAt: processStep.startedAt ?? now,
              completedAt: now
            }
          : processStep
      );
    }

    throw new BadRequestException(`Unsupported manufacturing phase status: ${step.status}`);
  }

  private resolveManufacturingStatus(processSteps: ManufacturingProcessStepSnapshot[]): ManufacturingRecordStatus {
    if (processSteps.every((step) => step.status === ManufacturingProcessStepStatus.COMPLETED)) {
      return ManufacturingRecordStatus.COMPLETED;
    }

    if (processSteps.some((step) => step.status !== ManufacturingProcessStepStatus.PENDING)) {
      return ManufacturingRecordStatus.IN_PROGRESS;
    }

    return ManufacturingRecordStatus.PENDING;
  }

  private async syncLinkedPurchaseOrderStatus(log: AuditLog): Promise<void> {
    if (!log.linkedOrder) {
      return;
    }

    if (log.manufacturingStatus === ManufacturingRecordStatus.COMPLETED) {
      await this.purchaseOrdersService.updateStatus(log.linkedOrder.id, PurchaseOrderStatus.COMPLETED);
      return;
    }

    if (log.manufacturingStatus === ManufacturingRecordStatus.IN_PROGRESS) {
      await this.purchaseOrdersService.updateStatus(log.linkedOrder.id, PurchaseOrderStatus.IN_PRODUCTION);
    }
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

  private assertRawMaterialCanBeConsumed(rawMaterial: InventoryItem): void {
    if (rawMaterial.category !== InventoryCategory.RAW_MATERIAL) {
      throw new BadRequestException('Selected inventory item must be a raw material');
    }

    if (rawMaterial.unit !== InventoryUnit.KG) {
      throw new BadRequestException('Raw material consumption must use inventory measured in KG');
    }
  }

  private async generateBatchNumber(productionDate: string): Promise<string> {
    const compactDate = productionDate.replace(/-/g, '');
    const count = await this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.batchNumber LIKE :prefix', { prefix: `BATCH-${compactDate}-%` })
      .getCount();
    return `BATCH-${compactDate}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateProcessSheetNumber(productionDate: string): Promise<string> {
    const compactDate = productionDate.replace(/-/g, '');
    const count = await this.processSheetRepository
      .createQueryBuilder('sheet')
      .where('sheet.sheetNumber LIKE :prefix', { prefix: `PS-${compactDate}-%` })
      .getCount();
    return `PS-${compactDate}-${String(count + 1).padStart(4, '0')}`;
  }
}
