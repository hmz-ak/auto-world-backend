import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class AuditLogItemDto {
  @ApiProperty({ example: 1, description: 'Inventory item ID' })
  @Type(() => Number)
  @IsInt()
  inventoryItemId: number;

  @ApiProperty({ example: 12.5, description: 'Quantity consumed' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantityConsumed: number;
}
