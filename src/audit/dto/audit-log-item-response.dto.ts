import { ApiProperty } from '@nestjs/swagger';

export class AuditLogItemResponseDto {
  @ApiProperty({ example: 1, description: 'Audit log item ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Inventory item ID' })
  inventoryItemId: number;

  @ApiProperty({ example: 'Steel Flat Bar 40mm', description: 'Inventory item name' })
  inventoryItemName: string;

  @ApiProperty({ example: '50_X_8', nullable: true, description: 'Raw material size, if applicable' })
  rawMaterialSize: string | null;

  @ApiProperty({ example: 'KG', description: 'Unit of measure' })
  unit: string;

  @ApiProperty({ example: 12.5, description: 'Quantity consumed' })
  quantityConsumed: number;
}
