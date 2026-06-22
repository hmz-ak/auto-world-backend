import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { AuditLogItemDto } from './audit-log-item.dto';

export class CreateAuditLogDto {
  @ApiProperty({ example: '4-Patti Kamani', description: 'Product produced' })
  @IsString()
  @MaxLength(150)
  productProduced: string;

  @ApiProperty({ example: 50, description: 'Quantity produced' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantityProduced: number;

  @ApiProperty({ example: '2026-06-22', description: 'Production date' })
  @IsDateString()
  productionDate: string;

  @ApiPropertyOptional({ example: 1, description: 'Linked purchase order ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  linkedOrderId?: number;

  @ApiPropertyOptional({ example: 'Day shift batch', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [AuditLogItemDto], description: 'Consumed inventory items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AuditLogItemDto)
  items: AuditLogItemDto[];
}
