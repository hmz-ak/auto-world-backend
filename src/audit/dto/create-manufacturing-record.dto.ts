import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';

export class ManufacturingKamaniItemDto {
  @ApiProperty({ example: '4L', description: 'Client-specific kamani type' })
  @IsString()
  @MaxLength(50)
  kamaniType: string;

  @ApiProperty({ example: 250, description: 'Number of pieces manufactured' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateManufacturingRecordDto {
  @ApiProperty({ example: 1, description: 'Client ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId: number;

  @ApiProperty({ example: 1, description: 'Raw material inventory item ID to consume from' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rawMaterialInventoryItemId: number;

  @ApiProperty({ example: '2026-06-23', description: 'Manufacturing/production date' })
  @IsString()
  productionDate: string;

  @ApiProperty({ type: [ManufacturingKamaniItemDto], description: 'Kamani types and quantities produced' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManufacturingKamaniItemDto)
  kamaniItems: ManufacturingKamaniItemDto[];

  @ApiPropertyOptional({ example: 'Day shift production', description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

