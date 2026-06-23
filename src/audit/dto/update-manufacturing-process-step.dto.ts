import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ManufacturingProcessStepStatus } from '../constants/manufacturing.constants';

export class UpdateManufacturingProcessStepDto {
  @ApiProperty({ example: 'BLANK_CUTTING', description: 'Manufacturing process phase key' })
  @IsString()
  phase: string;

  @ApiProperty({ enum: ManufacturingProcessStepStatus, description: 'New process phase status' })
  @IsEnum(ManufacturingProcessStepStatus)
  status: ManufacturingProcessStepStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Raw material inventory item to consume when starting the first phase'
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  rawMaterialInventoryItemId?: number;
}
