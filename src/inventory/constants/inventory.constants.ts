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

export enum InventoryRawMaterialSize {
  SIZE_50_X_6 = '50_X_6',
  SIZE_50_X_8 = '50_X_8',
  SIZE_50_X_9 = '50_X_9',
  SIZE_60_X_8 = '60_X_8'
}
