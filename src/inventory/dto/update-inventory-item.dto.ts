import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {
  @ApiPropertyOptional({ example: 80, description: 'Available quantity after manual stock correction' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  availableQuantity?: number;
}
