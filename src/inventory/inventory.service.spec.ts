import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseCategory } from '../expenses/constants/expense.constants';
import { ExpensesService } from '../expenses/expenses.service';
import {
  InventoryCategory,
  InventoryRawMaterialGrade,
  InventoryRawMaterialSize,
  InventoryStatus,
  InventorySubCategory,
  InventoryUnit
} from './constants/inventory.constants';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: { create: jest.Mock; findOne: jest.Mock; save: jest.Mock };
  let expensesService: { createSystemExpense: jest.Mock };

  beforeEach(async () => {
    inventoryRepository = {
      create: jest.fn((item) => item),
      findOne: jest.fn(),
      save: jest.fn((item) => Promise.resolve(item))
    };
    expensesService = { createSystemExpense: jest.fn(() => Promise.resolve()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: ExpensesService, useValue: expensesService },
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: inventoryRepository
        }
      ]
    }).compile();

    service = module.get(InventoryService);
  });

  function createInventoryItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
    return {
      id: 1,
      category: InventoryCategory.RAW_MATERIAL,
      unit: InventoryUnit.KG,
      subCategory: InventorySubCategory.SPRING_STEEL_FLAT_BAR,
      rawMaterialSize: InventoryRawMaterialSize.SIZE_50_X_6,
      rawMaterialGrade: InventoryRawMaterialGrade.SUP9,
      totalQuantity: 50000,
      availableQuantity: 50000,
      consumedQuantity: 0,
      purchasePricePerUnit: 245,
      status: InventoryStatus.AVAILABLE,
      notes: null,
      createdAt: new Date('2026-06-23'),
      updatedAt: new Date('2026-06-23'),
      ...overrides
    };
  }

  describe('create', () => {
    it('should create a raw material expense when inventory is added', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-24T09:00:00.000Z'));

      await service.create({
        category: InventoryCategory.RAW_MATERIAL,
        unit: InventoryUnit.KG,
        subCategory: InventorySubCategory.SPRING_STEEL_FLAT_BAR,
        rawMaterialSize: InventoryRawMaterialSize.SIZE_50_X_6,
        rawMaterialGrade: InventoryRawMaterialGrade.SUP9,
        totalQuantity: 100,
        purchasePricePerUnit: 250,
        notes: 'Fresh stock'
      });

      expect(expensesService.createSystemExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ExpenseCategory.RAW_MATERIAL,
          subCategory: InventorySubCategory.SPRING_STEEL_FLAT_BAR,
          description: 'Inventory purchase: SUP9 Spring steel flat bar / patti 50 x 6',
          amount: 25000,
          expenseDate: '2026-06-24'
        })
      );

      jest.useRealTimers();
    });

    it.each([
      [InventoryCategory.CONSUMABLE, InventorySubCategory.QUENCHING_OIL, ExpenseCategory.RAW_MATERIAL, 'Quenching oil'],
      [InventoryCategory.HARDWARE, InventorySubCategory.CENTER_BOLTS, ExpenseCategory.RAW_MATERIAL, 'Center bolts'],
      [InventoryCategory.PAINT, InventorySubCategory.PRIMER, ExpenseCategory.RAW_MATERIAL, 'Primer'],
      [InventoryCategory.OTHER, undefined, ExpenseCategory.OTHER, 'Other']
    ])('should create a %s expense when %s inventory is added', async (inventoryCategory, subCategory, expenseCategory, label) => {
      await service.create({
        category: inventoryCategory,
        unit: InventoryUnit.KG,
        subCategory,
        totalQuantity: 10,
        purchasePricePerUnit: 100
      });

      expect(expensesService.createSystemExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expenseCategory,
          subCategory,
          description: `Inventory purchase: ${label}`,
          amount: 1000
        })
      );
    });
  });

  describe('computeStatus', () => {
    it('should return OUT_OF_STOCK when availableQuantity is zero', () => {
      expect(service.computeStatus(0, 100)).toBe(InventoryStatus.OUT_OF_STOCK);
    });

    it('should return LOW_STOCK when availableQuantity is below 10 percent of totalQuantity', () => {
      expect(service.computeStatus(5, 100)).toBe(InventoryStatus.LOW_STOCK);
    });

    it('should return AVAILABLE when availableQuantity is above 10 percent of totalQuantity', () => {
      expect(service.computeStatus(50, 100)).toBe(InventoryStatus.AVAILABLE);
    });

    it('should return AVAILABLE when availableQuantity is exactly 10 percent of totalQuantity', () => {
      expect(service.computeStatus(10, 100)).toBe(InventoryStatus.AVAILABLE);
    });

    it('should return LOW_STOCK when availableQuantity is just below 10 percent of totalQuantity', () => {
      expect(service.computeStatus(9.99, 100)).toBe(InventoryStatus.LOW_STOCK);
    });
  });

  describe('update', () => {
    it('should recalculate available quantity when total quantity is edited', async () => {
      inventoryRepository.findOne.mockResolvedValue(createInventoryItem());

      const result = await service.update(1, { totalQuantity: 20000 });

      expect(inventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          totalQuantity: 20000,
          availableQuantity: 20000
        })
      );
      expect(result.totalQuantity).toBe(20000);
      expect(result.availableQuantity).toBe(20000);
    });

    it('should keep consumed quantity deducted when total quantity is edited after consumption', async () => {
      inventoryRepository.findOne.mockResolvedValue(
        createInventoryItem({ totalQuantity: 50000, availableQuantity: 45000, consumedQuantity: 5000 })
      );

      const result = await service.update(1, { totalQuantity: 20000 });

      expect(result.totalQuantity).toBe(20000);
      expect(result.availableQuantity).toBe(15000);
      expect(result.consumedQuantity).toBe(5000);
    });

    it('should reject total quantity below already consumed quantity', async () => {
      inventoryRepository.findOne.mockResolvedValue(
        createInventoryItem({ totalQuantity: 50000, availableQuantity: 45000, consumedQuantity: 5000 })
      );

      await expect(service.update(1, { totalQuantity: 4000 })).rejects.toThrow(
        'Total quantity cannot be less than already consumed quantity'
      );
      expect(inventoryRepository.save).not.toHaveBeenCalled();
    });

    it('should update available quantity when explicitly edited', async () => {
      inventoryRepository.findOne.mockResolvedValue(createInventoryItem());

      const result = await service.update(1, { availableQuantity: 20000 });

      expect(result.totalQuantity).toBe(50000);
      expect(result.availableQuantity).toBe(20000);
      expect(result.totalValue).toBe(4900000);
    });

    it('should respect explicit available quantity when total quantity is edited in the same request', async () => {
      inventoryRepository.findOne.mockResolvedValue(
        createInventoryItem({ totalQuantity: 50000, availableQuantity: 45000, consumedQuantity: 5000 })
      );

      const result = await service.update(1, { totalQuantity: 20000, availableQuantity: 12000 });

      expect(result.totalQuantity).toBe(20000);
      expect(result.availableQuantity).toBe(12000);
      expect(result.consumedQuantity).toBe(5000);
    });

    it('should reject available quantity above total minus consumed quantity', async () => {
      inventoryRepository.findOne.mockResolvedValue(
        createInventoryItem({ totalQuantity: 50000, availableQuantity: 45000, consumedQuantity: 5000 })
      );

      await expect(service.update(1, { availableQuantity: 46000 })).rejects.toThrow(
        'Available quantity cannot exceed total quantity minus consumed quantity'
      );
      expect(inventoryRepository.save).not.toHaveBeenCalled();
    });
  });

  it('should calculate total value from available quantity', () => {
    const result = service.mapItem(
      createInventoryItem({ totalQuantity: 50000, availableQuantity: 20000, consumedQuantity: 30000, purchasePricePerUnit: 245 })
    );

    expect(result.totalValue).toBe(4900000);
    expect(result.remainingMaterialValue).toBe(4900000);
    expect(result.consumedMaterialValue).toBe(7350000);
    expect(result.displayName).toBe('SUP9 Spring steel flat bar / patti 50 x 6');
  });
});
