import { ApiProperty } from '@nestjs/swagger';

export class InventoryItemResponseDto {
  @ApiProperty({ example: 1, description: 'Inventory item ID' })
  id: number;

  @ApiProperty({ example: 'Steel Flat Bar 40mm', description: 'Item name' })
  name: string;

  @ApiProperty({ example: 'RAW_MATERIAL', description: 'Inventory category' })
  category: string;

  @ApiProperty({ example: 'KG', description: 'Unit of measure' })
  unit: string;

  @ApiProperty({ example: 100, description: 'Total quantity ever added' })
  totalQuantity: number;

  @ApiProperty({ example: 80, description: 'Available quantity' })
  availableQuantity: number;

  @ApiProperty({ example: 20, description: 'Consumed quantity' })
  consumedQuantity: number;

  @ApiProperty({ example: 250.5, description: 'Purchase price per unit' })
  purchasePricePerUnit: number;

  @ApiProperty({ example: 20040, description: 'Computed available inventory value' })
  totalValue: number;

  @ApiProperty({ example: 'AVAILABLE', description: 'Computed stock status' })
  status: string;

  @ApiProperty({ example: 'Alloy steel patti', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}
