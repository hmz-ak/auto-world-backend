import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';
import { ManufacturingKamaniItemDto } from './create-manufacturing-record.dto';

export class CreateManufacturingProcessSheetDto {
  @ApiProperty({ example: '2026-06-23', description: 'Process sheet production date' })
  @IsString()
  productionDate: string;

  @ApiProperty({ type: [ManufacturingKamaniItemDto], description: 'Kamani quantities covered by this process sheet' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ManufacturingKamaniItemDto)
  kamaniItems: ManufacturingKamaniItemDto[];

  @ApiPropertyOptional({ example: 'First dispatch lot', description: 'Optional process sheet notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
