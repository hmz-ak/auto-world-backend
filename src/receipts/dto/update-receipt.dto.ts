import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateReceiptDto {
  @ApiPropertyOptional({ example: '2026-06-22', description: 'Issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: 0, description: 'Tax amount in PKR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 'LES-7986', description: 'Vehicle or car registration number' })
  @IsOptional()
  @IsString()
  carRegistrationNumber?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Receipt notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
