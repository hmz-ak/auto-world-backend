import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryResponseDto {
  @ApiProperty({ example: 12, description: 'Total inventory item count' })
  totalItems: number;

  @ApiProperty({ example: 125000, description: 'Total available inventory value' })
  totalInventoryValue: number;

  @ApiProperty({ example: 2, description: 'Low stock item count' })
  lowStockCount: number;

  @ApiProperty({ example: 1, description: 'Out of stock item count' })
  outOfStockCount: number;
}
