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

export enum InventoryRawMaterialGrade {
  SUP9 = 'SUP9',
  EN45 = 'EN45',
  SAE_5160 = '5160',
  GRADE_55SI7 = '55SI7',
  GRADE_60SI7 = '60SI7',
  GRADE_51CRV4 = '51CRV4'
}

export enum InventorySubCategory {
  SPRING_STEEL_FLAT_BAR = 'SPRING_STEEL_FLAT_BAR',
  FURNACE_OIL = 'FURNACE_OIL',
  QUENCHING_OIL = 'QUENCHING_OIL',
  GRINDING_CUTTING_WHEELS = 'GRINDING_CUTTING_WHEELS',
  WELDING_RODS = 'WELDING_RODS',
  SHOT_PEENING_MEDIA = 'SHOT_PEENING_MEDIA',
  CENTER_BOLTS = 'CENTER_BOLTS',
  CLAMPS_CLIPS = 'CLAMPS_CLIPS',
  BUSHES = 'BUSHES',
  EYE_PINS = 'EYE_PINS',
  PRIMER = 'PRIMER',
  BLACK_PAINT_COATING = 'BLACK_PAINT_COATING',
  THINNER = 'THINNER'
}

export const INVENTORY_SUB_CATEGORIES_BY_CATEGORY: Record<InventoryCategory, InventorySubCategory[]> = {
  [InventoryCategory.RAW_MATERIAL]: [InventorySubCategory.SPRING_STEEL_FLAT_BAR],
  [InventoryCategory.CONSUMABLE]: [
    InventorySubCategory.FURNACE_OIL,
    InventorySubCategory.QUENCHING_OIL,
    InventorySubCategory.GRINDING_CUTTING_WHEELS,
    InventorySubCategory.WELDING_RODS,
    InventorySubCategory.SHOT_PEENING_MEDIA
  ],
  [InventoryCategory.HARDWARE]: [
    InventorySubCategory.CENTER_BOLTS,
    InventorySubCategory.CLAMPS_CLIPS,
    InventorySubCategory.BUSHES,
    InventorySubCategory.EYE_PINS
  ],
  [InventoryCategory.PAINT]: [
    InventorySubCategory.PRIMER,
    InventorySubCategory.BLACK_PAINT_COATING,
    InventorySubCategory.THINNER
  ],
  [InventoryCategory.OTHER]: []
};
