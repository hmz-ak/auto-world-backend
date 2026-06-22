import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InventoryStatus, InventoryUnit } from '../inventory/constants/inventory.constants';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryService } from '../inventory/inventory.service';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogItem } from './entities/audit-log-item.entity';
import { AuditLog } from './entities/audit-log.entity';

function createInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 1,
    name: 'Steel Patti',
    category: 'RAW_MATERIAL' as InventoryItem['category'],
    unit: InventoryUnit.KG,
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
  let auditRepository: { createQueryBuilder: jest.Mock; findOne: jest.Mock; findAndCount: jest.Mock; save: jest.Mock };
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
    auditRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0)
      })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn()
    };
    manager = {
      create: jest.fn((_entity, data) => data),
      save: jest.fn((entity) =>
        Promise.resolve({
          id: entity.productProduced ? 55 : 500,
          createdAt: new Date('2026-06-20'),
          ...entity
        })
      ),
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
        { provide: PurchaseOrdersService, useValue: { findEntityById: jest.fn() } },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepository }
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
      linkedOrder: null,
      notes: null,
      items: items.map((inventoryItem, index) => ({
        id: index + 1,
        inventoryItem,
        quantityConsumed: index + 1
      })),
      createdAt: new Date('2026-06-20')
    });
  }

  it('should throw BadRequestException if consumed quantity exceeds availableQuantity for any item', async () => {
    inventoryService.assertAvailable.mockRejectedValue(
      new BadRequestException('Not enough stock for Steel Patti. Available: 10, Requested: 12')
    );

    await expect(service.createBatch(createDto([{ inventoryItemId: 1, quantityConsumed: 12 }]))).rejects.toThrow(
      'Steel Patti'
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
    const second = createInventoryItem({ id: 2, name: 'Quenching Oil', availableQuantity: 40 });
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
    const second = createInventoryItem({ id: 2, name: 'Quenching Oil', availableQuantity: 40 });
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
});
