import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  InventoryCategory,
  InventoryRawMaterialGrade,
  InventoryRawMaterialSize,
  InventorySubCategory,
  InventoryUnit
} from '../constants/inventory.constants';

export class CreateInventoryItemDto {
  @ApiProperty({ enum: InventoryCategory, description: 'Inventory category' })
  @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @ApiProperty({ enum: InventoryUnit, description: 'Unit of measure' })
  @IsEnum(InventoryUnit)
  unit: InventoryUnit;

  @ApiPropertyOptional({
    enum: InventorySubCategory,
    description: 'Inventory subcategory under the selected category'
  })
  @IsOptional()
  @IsEnum(InventorySubCategory)
  subCategory?: InventorySubCategory;

  @ApiPropertyOptional({
    enum: InventoryRawMaterialSize,
    description: 'Required when category is RAW_MATERIAL'
  })
  @IsOptional()
  @IsEnum(InventoryRawMaterialSize)
  rawMaterialSize?: InventoryRawMaterialSize;

  @ApiPropertyOptional({
    enum: InventoryRawMaterialGrade,
    description: 'Spring steel grade when category is RAW_MATERIAL'
  })
  @IsOptional()
  @IsEnum(InventoryRawMaterialGrade)
  rawMaterialGrade?: InventoryRawMaterialGrade;

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
