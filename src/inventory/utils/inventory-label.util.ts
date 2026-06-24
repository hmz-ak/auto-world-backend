import {
  InventoryCategory,
  InventoryRawMaterialSize,
  InventorySubCategory
} from '../constants/inventory.constants';

interface InventoryItemLabelSource {
  category: InventoryCategory | string;
  subCategory?: InventorySubCategory | string | null;
  rawMaterialSize?: InventoryRawMaterialSize | string | null;
  rawMaterialGrade?: string | null;
}

const INVENTORY_SUB_CATEGORY_LABELS: Record<string, string> = {
  [InventorySubCategory.SPRING_STEEL_FLAT_BAR]: 'Spring steel flat bar / patti',
  [InventorySubCategory.FURNACE_OIL]: 'Furnace oil',
  [InventorySubCategory.QUENCHING_OIL]: 'Quenching oil',
  [InventorySubCategory.GRINDING_CUTTING_WHEELS]: 'Grinding/cutting wheels',
  [InventorySubCategory.WELDING_RODS]: 'Welding rods',
  [InventorySubCategory.SHOT_PEENING_MEDIA]: 'Shot peening media',
  [InventorySubCategory.CENTER_BOLTS]: 'Center bolts',
  [InventorySubCategory.CLAMPS_CLIPS]: 'Clamps / clips',
  [InventorySubCategory.BUSHES]: 'Bushes',
  [InventorySubCategory.EYE_PINS]: 'Eye pins',
  [InventorySubCategory.PRIMER]: 'Primer',
  [InventorySubCategory.BLACK_PAINT_COATING]: 'Black paint / coating',
  [InventorySubCategory.THINNER]: 'Thinner'
};

const RAW_MATERIAL_SIZE_LABELS: Record<string, string> = {
  [InventoryRawMaterialSize.SIZE_50_X_6]: '50 x 6',
  [InventoryRawMaterialSize.SIZE_50_X_8]: '50 x 8',
  [InventoryRawMaterialSize.SIZE_50_X_9]: '50 x 9',
  [InventoryRawMaterialSize.SIZE_60_X_8]: '60 x 8'
};

function formatEnumLabel(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildInventoryItemLabel(item: InventoryItemLabelSource): string {
  const typeLabel = item.subCategory
    ? INVENTORY_SUB_CATEGORY_LABELS[item.subCategory] ?? formatEnumLabel(item.subCategory)
    : formatEnumLabel(item.category);

  if (item.category === InventoryCategory.RAW_MATERIAL) {
    const sizeLabel = item.rawMaterialSize ? RAW_MATERIAL_SIZE_LABELS[item.rawMaterialSize] ?? item.rawMaterialSize : null;
    return [item.rawMaterialGrade, typeLabel, sizeLabel].filter(Boolean).join(' ');
  }

  return typeLabel;
}
