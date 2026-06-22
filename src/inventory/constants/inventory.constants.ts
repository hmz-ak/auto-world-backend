export enum InventoryCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  CONSUMABLE = 'CONSUMABLE',
  HARDWARE = 'HARDWARE',
  PAINT = 'PAINT',
  OTHER = 'OTHER'
}

export enum InventoryUnit {
  KG = 'KG',
  METER = 'METER',
  PIECE = 'PIECE',
  LITER = 'LITER',
  TON = 'TON'
}

export enum InventoryStatus {
  AVAILABLE = 'AVAILABLE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}
