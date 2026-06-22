import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryStatus } from './constants/inventory.constants';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: {}
        }
      ]
    }).compile();

    service = module.get(InventoryService);
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
});
