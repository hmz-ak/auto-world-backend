import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty({ example: 1, description: 'Inventory item ID' })
  id: number;

  @ApiProperty({ example: 'SUP9 Spring steel flat bar / patti 50 x 6', description: 'Computed inventory display label' })
  displayName: string;

  @ApiProperty({ example: 'RAW_MATERIAL', description: 'Inventory category' })
  category: string;

  @ApiProperty({ example: 'KG', description: 'Unit of measure' })
  unit: string;

  @ApiProperty({ example: 'SPRING_STEEL_FLAT_BAR', nullable: true, description: 'Inventory subcategory' })
  subCategory: string | null;

  @ApiProperty({ example: '50_X_8', nullable: true, description: 'Raw material size, if applicable' })
  rawMaterialSize: string | null;

  @ApiProperty({ example: 'SUP9', nullable: true, description: 'Raw material grade, if applicable' })
  rawMaterialGrade: string | null;

  @ApiProperty({ example: 100, description: 'Total quantity ever added' })
  totalQuantity: number;

  @ApiProperty({ example: 80, description: 'Available quantity' })
  availableQuantity: number;

  @ApiProperty({ example: 20, description: 'Consumed quantity' })
  consumedQuantity: number;

  @ApiProperty({ example: 250.5, description: 'Purchase price per unit' })
  purchasePricePerUnit: number;

  @ApiProperty({ example: 20040, description: 'Computed available inventory value kept for backward compatibility' })
  totalValue: number;

  @ApiProperty({ example: 20040, description: 'Current value of material still available in inventory' })
  remainingMaterialValue: number;

  @ApiProperty({ example: 5010, description: 'Value of inventory material that has already been consumed' })
  consumedMaterialValue: number;

  @ApiProperty({ example: 'AVAILABLE', description: 'Computed stock status' })
  status: string;

  @ApiProperty({ example: 'Alloy steel patti', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}
