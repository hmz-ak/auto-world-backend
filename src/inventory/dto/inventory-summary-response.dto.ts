import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryResponseDto {
  @ApiProperty({ example: 12, description: 'Total inventory item count' })
  totalItems: number;

  @ApiProperty({ example: 125000, description: 'Total available inventory value kept for backward compatibility' })
  totalInventoryValue: number;

  @ApiProperty({ example: 125000, description: 'Current value of material still available in inventory' })
  remainingMaterialValue: number;

  @ApiProperty({ example: 50000, description: 'Value of inventory material that has already been consumed' })
  consumedMaterialValue: number;

  @ApiProperty({ example: 2, description: 'Low stock item count' })
  lowStockCount: number;

  @ApiProperty({ example: 1, description: 'Out of stock item count' })
  outOfStockCount: number;
}
