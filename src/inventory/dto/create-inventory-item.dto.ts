import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { InventoryCategory, InventoryUnit } from '../constants/inventory.constants';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Steel Flat Bar 40mm', description: 'Inventory item name' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: InventoryCategory, description: 'Inventory category' })
  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @ApiProperty({ enum: InventoryUnit, description: 'Unit of measure' })
  @IsEnum(InventoryUnit)
  unit: InventoryUnit;

  @ApiProperty({ example: 100, description: 'Total quantity purchased' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalQuantity: number;

  @ApiProperty({ example: 250.5, description: 'Purchase price per unit in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePricePerUnit: number;

  @ApiPropertyOptional({ example: 'Imported alloy steel patti', description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
