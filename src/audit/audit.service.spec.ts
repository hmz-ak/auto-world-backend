import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClientsService } from '../clients/clients.service';
import {
  InventoryRawMaterialGrade,
  InventoryRawMaterialSize,
  InventoryStatus,
  InventorySubCategory,
  InventoryUnit
} from '../inventory/constants/inventory.constants';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrderStatus } from '../purchase-orders/constants/purchase-order.constants';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { AuditService } from './audit.service';
import {
  MANUFACTURING_PROCESS_PHASES,
  ManufacturingProcessStepStatus,
  ManufacturingRecordStatus
} from './constants/manufacturing.constants';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog } from './entities/audit-log.entity';
import { ManufacturingProcessSheet } from './entities/manufacturing-process-sheet.entity';

function createInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 1,
    category: 'RAW_MATERIAL' as InventoryItem['category'],
    unit: InventoryUnit.KG,
    subCategory: InventorySubCategory.SPRING_STEEL_FLAT_BAR,
    rawMaterialSize: InventoryRawMaterialSize.SIZE_50_X_6,
    rawMaterialGrade: InventoryRawMaterialGrade.SUP9,
    totalQuantity: 100,
    availableQuantity: 100,
    consumedQuantity: 0,
    purchasePricePerUnit: 1000,
    status: InventoryStatus.AVAILABLE,
    notes: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides
  };
}

function createAuditLogItem(inventoryItem = createInventoryItem()): AuditLogItem {
  return {
    id: 1,
    auditLog: {} as AuditLog,
    inventoryItem,
    processSheet: null,
    quantityConsumed: 10,
    createdAt: new Date('2026-06-20')
  };
}

function createDto(items: CreateAuditLogDto['items']): CreateAuditLogDto {
  return {
    productProduced: '4-Patti Kamani',
    quantityProduced: 10,
    productionDate: '2026-06-20',
    notes: null,
    items
  };
}

describe('AuditService', () => {
  let service: AuditService;
  let dataSource: { transaction: jest.Mock };
  let inventoryService: { assertAvailable: jest.Mock; computeStatus: jest.Mock };
  let purchaseOrdersService: { findEntityById: jest.Mock; updateStatus: jest.Mock };
  let auditRepository: { createQueryBuilder: jest.Mock; findOne: jest.Mock; findAndCount: jest.Mock; save: jest.Mock };
  let processSheetRepository: {
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let manager: { create: jest.Mock; save: jest.Mock; update: jest.Mock };

  beforeEach(async () => {
    const statusCalculator = (availableQuantity: number, totalQuantity: number): InventoryStatus => {
      if (availableQuantity === 0) {
        return InventoryStatus.OUT_OF_STOCK;
      }
      return availableQuantity < totalQuantity * 0.1 ? InventoryStatus.LOW_STOCK : InventoryStatus.AVAILABLE;
    };

    inventoryService = {
      assertAvailable: jest.fn(),
      computeStatus: jest.fn(statusCalculator)
    };
    purchaseOrdersService = {
      findEntityById: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue({})
    };
    auditRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0)
      })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn()
    };
    processSheetRepository = {
      create: jest.fn((data) => data),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0)
      })),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((entity) => Promise.resolve({ id: 900, createdAt: new Date('2026-06-20'), ...entity }))
    };
    manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn((entityOrTarget, maybeEntity) => {
        const entity = maybeEntity ?? entityOrTarget;
        return Promise.resolve({
          id: entity.productProduced ? 55 : 500,
          createdAt: new Date('2026-06-20'),
          ...entity
        });
      }),
      update: jest.fn(() => Promise.resolve({ affected: 1 }))
    };
    dataSource = {
      transaction: jest.fn((callback) => callback(manager))
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DataSource, useValue: dataSource },
        { provide: InventoryService, useValue: inventoryService },
        { provide: ClientsService, useValue: { findEntityById: jest.fn() } },
        { provide: PurchaseOrdersService, useValue: purchaseOrdersService },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepository },
        { provide: getRepositoryToken(ManufacturingProcessSheet), useValue: processSheetRepository }
      ]
    }).compile();

    service = module.get(AuditService);
  });

  function mockFindOneWithItems(items: InventoryItem[]): void {
    auditRepository.findOne.mockResolvedValue({
      id: 55,
      batchNumber: 'BATCH-20260620-0001',
      productProduced: '4-Patti Kamani',
      quantityProduced: 10,
      productionDate: '2026-06-20',
      linkedOrder: { id: 88, orderNumber: 'PO-20260620-0001' },
      client: null,
      manufacturingItems: null,
      totalWeightConsumed: 0,
      manufacturingStatus: ManufacturingRecordStatus.PENDING,
      processSteps: null,
      notes: null,
      items: items.map((inventoryItem, index) => ({
        id: index + 1,
        inventoryItem,
        quantityConsumed: index + 1
      })),
      createdAt: new Date('2026-06-20')
    });
  }

  function mockManufacturingRecord(overrides: Partial<AuditLog> = {}): void {
    auditRepository.findOne.mockResolvedValue({
      id: 55,
      batchNumber: 'BATCH-20260620-0001',
      productProduced: 'New Asia Kamani',
      quantityProduced: 10,
      productionDate: '2026-06-20',
      linkedOrder: { id: 88, orderNumber: 'PO-20260620-0001' },
      client: { id: 1, name: 'New Asia' },
      manufacturingItems: [],
      totalWeightConsumed: 0,
      manufacturingStatus: ManufacturingRecordStatus.PENDING,
      processSteps: null,
      notes: null,
      items: [],
      createdAt: new Date('2026-06-20'),
      ...overrides
    });
  }

  it('should throw BadRequestException if consumed quantity exceeds availableQuantity for any item', async () => {
    inventoryService.assertAvailable.mockRejectedValue(
      new BadRequestException('Not enough stock for SUP9 Spring steel flat bar / patti 50 x 6. Available: 10, Requested: 12')
    );

    await expect(service.createBatch(createDto([{ inventoryItemId: 1, quantityConsumed: 12 }]))).rejects.toThrow(
      'SUP9 Spring steel flat bar / patti 50 x 6'
    );
    await expect(service.createBatch(createDto([{ inventoryItemId: 1, quantityConsumed: 12 }]))).rejects.toThrow(
      'Available: 10'
    );
    await expect(service.createBatch(createDto([{ inventoryItemId: 1, quantityConsumed: 12 }]))).rejects.toThrow(
      'Requested: 12'
    );
  });

  it('should deduct consumed quantity from inventoryItem.availableQuantity', async () => {
    const item = createInventoryItem({ availableQuantity: 45, consumedQuantity: 10 });
    inventoryService.assertAvailable.mockResolvedValue(item);
    mockFindOneWithItems([item]);

    await service.createBatch(createDto([{ inventoryItemId: item.id, quantityConsumed: 15 }]));

    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      item.id,
      expect.objectContaining({ availableQuantity: 30 })
    );
  });

  it('should add consumed quantity to inventoryItem.consumedQuantity', async () => {
    const item = createInventoryItem({ availableQuantity: 45, consumedQuantity: 10 });
    inventoryService.assertAvailable.mockResolvedValue(item);
    mockFindOneWithItems([item]);

    await service.createBatch(createDto([{ inventoryItemId: item.id, quantityConsumed: 15 }]));

    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      item.id,
      expect.objectContaining({ consumedQuantity: 25 })
    );
  });

  it('should recompute inventoryItem.status to OUT_OF_STOCK when availableQuantity reaches zero', async () => {
    const item = createInventoryItem({ availableQuantity: 10, totalQuantity: 100 });
    inventoryService.assertAvailable.mockResolvedValue(item);
    mockFindOneWithItems([item]);

    await service.createBatch(createDto([{ inventoryItemId: item.id, quantityConsumed: 10 }]));

    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      item.id,
      expect.objectContaining({ status: InventoryStatus.OUT_OF_STOCK })
    );
  });

  it('should recompute inventoryItem.status to LOW_STOCK when availableQuantity is below 10 percent of total', async () => {
    const item = createInventoryItem({ availableQuantity: 14, totalQuantity: 100 });
    inventoryService.assertAvailable.mockResolvedValue(item);
    mockFindOneWithItems([item]);

    await service.createBatch(createDto([{ inventoryItemId: item.id, quantityConsumed: 6 }]));

    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      item.id,
      expect.objectContaining({ status: InventoryStatus.LOW_STOCK })
    );
  });

  it('should recompute inventoryItem.status to AVAILABLE when above 10 percent of total', async () => {
    const item = createInventoryItem({ availableQuantity: 30, totalQuantity: 100 });
    inventoryService.assertAvailable.mockResolvedValue(item);
    mockFindOneWithItems([item]);

    await service.createBatch(createDto([{ inventoryItemId: item.id, quantityConsumed: 5 }]));

    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      item.id,
      expect.objectContaining({ status: InventoryStatus.AVAILABLE })
    );
  });

  it('should create one AuditLogItem per consumed item in the request', async () => {
    const first = createInventoryItem({ id: 1, availableQuantity: 100 });
    const second = createInventoryItem({ id: 2, availableQuantity: 40 });
    inventoryService.assertAvailable.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    mockFindOneWithItems([first, second]);

    await service.createBatch(
      createDto([
        { inventoryItemId: first.id, quantityConsumed: 12 },
        { inventoryItemId: second.id, quantityConsumed: 4 }
      ])
    );

    const auditLogItemCreates = manager.create.mock.calls.filter(([entity]) => entity === AuditLogItem);
    expect(auditLogItemCreates).toHaveLength(2);
  });

  it('should use a transaction for deduction writes so failures rollback together', async () => {
    const first = createInventoryItem({ id: 1, availableQuantity: 100 });
    const second = createInventoryItem({ id: 2, availableQuantity: 40 });
    inventoryService.assertAvailable.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    manager.update.mockRejectedValueOnce(new Error('database failure'));

    await expect(
      service.createBatch(
        createDto([
          { inventoryItemId: first.id, quantityConsumed: 12 },
          { inventoryItemId: second.id, quantityConsumed: 4 }
        ])
      )
    ).rejects.toThrow('database failure');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('should update manufacturing status when a process phase moves in progress', async () => {
    mockManufacturingRecord({ items: [createAuditLogItem()] });
    auditRepository.save.mockImplementation((log) => {
      auditRepository.findOne.mockResolvedValue(log);
      return Promise.resolve(log);
    });

    const result = await service.updateManufacturingProcessStep(55, {
      phase: 'BLANK_CUTTING',
      status: ManufacturingProcessStepStatus.IN_PROGRESS
    });

    expect(auditRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ manufacturingStatus: ManufacturingRecordStatus.IN_PROGRESS })
    );
    expect(result.manufacturingStatus).toBe(ManufacturingRecordStatus.IN_PROGRESS);
    expect(result.processSteps.find((step) => step.phase === 'BLANK_CUTTING')?.status).toBe(
      ManufacturingProcessStepStatus.IN_PROGRESS
    );
    expect(result.isReadyForReceipt).toBe(false);
    expect(purchaseOrdersService.updateStatus).toHaveBeenCalledWith(88, PurchaseOrderStatus.IN_PRODUCTION);
  });

  it('should require raw material when starting an unconsumed purchase-order manufacturing record', async () => {
    mockManufacturingRecord({ totalWeightConsumed: 2675, items: [] });

    await expect(
      service.updateManufacturingProcessStep(55, {
        phase: 'BLANK_CUTTING',
        status: ManufacturingProcessStepStatus.IN_PROGRESS
      })
    ).rejects.toThrow('Select raw material before starting manufacturing');
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should consume raw material when starting an unconsumed purchase-order manufacturing record', async () => {
    const rawMaterial = createInventoryItem({
      id: 9,
      availableQuantity: 5000,
      consumedQuantity: 25,
      totalQuantity: 6000
    });
    inventoryService.assertAvailable.mockResolvedValue(rawMaterial);
    mockManufacturingRecord({ totalWeightConsumed: 2675, items: [] });

    const result = await service.updateManufacturingProcessStep(55, {
      phase: 'BLANK_CUTTING',
      status: ManufacturingProcessStepStatus.IN_PROGRESS,
      rawMaterialInventoryItemId: rawMaterial.id
    });

    expect(inventoryService.assertAvailable).toHaveBeenCalledWith(rawMaterial.id, 2675);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(
      InventoryItem,
      rawMaterial.id,
      expect.objectContaining({
        availableQuantity: 2325,
        consumedQuantity: 2700
      })
    );
    expect(manager.create).toHaveBeenCalledWith(
      AuditLogItem,
      expect.objectContaining({
        inventoryItem: rawMaterial,
        quantityConsumed: 2675
      })
    );
    expect(result.manufacturingStatus).toBe(ManufacturingRecordStatus.IN_PROGRESS);
    expect(purchaseOrdersService.updateStatus).toHaveBeenCalledWith(88, PurchaseOrderStatus.IN_PRODUCTION);
  });

  it('should reject process sheet quantities above remaining manufacturing quantity', async () => {
    mockManufacturingRecord({
      manufacturingItems: [{ kamaniType: '4L', quantity: 100, unitWeight: 7.3, totalWeight: 730 }],
      processSheets: [
        {
          id: 900,
          sheetNumber: 'PS-20260620-0001',
          manufacturingRecord: {} as AuditLog,
          productionDate: '2026-06-20',
          manufacturingItems: [{ kamaniType: '4L', quantity: 80, unitWeight: 7.3, totalWeight: 584 }],
          quantityProduced: 80,
          totalWeightConsumed: 584,
          manufacturingStatus: ManufacturingRecordStatus.PENDING,
          processSteps: [],
          notes: null,
          consumedItems: [],
          createdAt: new Date('2026-06-20'),
          updatedAt: new Date('2026-06-20')
        }
      ]
    });

    await expect(
      service.createManufacturingProcessSheet(55, {
        productionDate: '2026-06-21',
        kamaniItems: [{ kamaniType: '4L', quantity: 30 }]
      })
    ).rejects.toThrow('4L exceeds remaining quantity. Remaining: 20');
    expect(processSheetRepository.save).not.toHaveBeenCalled();
  });

  it('should reject starting a later process phase before previous phases are completed', async () => {
    mockManufacturingRecord();

    await expect(
      service.updateManufacturingProcessStep(55, {
        phase: 'EYE_ROLLING',
        status: ManufacturingProcessStepStatus.IN_PROGRESS
      })
    ).rejects.toThrow('Previous manufacturing phases must be completed first');
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('should reject completing a process phase before it has started', async () => {
    mockManufacturingRecord();

    await expect(
      service.updateManufacturingProcessStep(55, {
        phase: 'BLANK_CUTTING',
        status: ManufacturingProcessStepStatus.COMPLETED
      })
    ).rejects.toThrow('Pending manufacturing phases can only be started');
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing a completed process phase', async () => {
    mockManufacturingRecord({
      processSteps: MANUFACTURING_PROCESS_PHASES.map((step, index) => ({
        phase: step.phase,
        label: step.label,
        status: index === 0
          ? ManufacturingProcessStepStatus.COMPLETED
          : ManufacturingProcessStepStatus.PENDING,
        startedAt: index === 0 ? '2026-06-20T10:00:00.000Z' : null,
        completedAt: index === 0 ? '2026-06-20T11:00:00.000Z' : null
      }))
    });

    await expect(
      service.updateManufacturingProcessStep(55, {
        phase: 'BLANK_CUTTING',
        status: ManufacturingProcessStepStatus.IN_PROGRESS
      })
    ).rejects.toThrow('Blank cutting is already completed');
    expect(auditRepository.save).not.toHaveBeenCalled();
  });

  it('should mark linked purchase order completed when all process phases are completed', async () => {
    mockManufacturingRecord({
      manufacturingStatus: ManufacturingRecordStatus.IN_PROGRESS,
      processSteps: MANUFACTURING_PROCESS_PHASES.map((step) => ({
        phase: step.phase,
        label: step.label,
        status: step.phase === 'DISPATCH'
          ? ManufacturingProcessStepStatus.IN_PROGRESS
          : ManufacturingProcessStepStatus.COMPLETED,
        startedAt: '2026-06-20T10:00:00.000Z',
        completedAt: step.phase === 'DISPATCH' ? null : '2026-06-20T11:00:00.000Z'
      })),
    });
    auditRepository.save.mockImplementation((log) => {
      auditRepository.findOne.mockResolvedValue(log);
      return Promise.resolve(log);
    });

    const result = await service.updateManufacturingProcessStep(55, {
      phase: 'DISPATCH',
      status: ManufacturingProcessStepStatus.COMPLETED
    });

    expect(result.manufacturingStatus).toBe(ManufacturingRecordStatus.COMPLETED);
    expect(result.isReadyForReceipt).toBe(true);
    expect(purchaseOrdersService.updateStatus).toHaveBeenCalledWith(88, PurchaseOrderStatus.COMPLETED);
  });
});
