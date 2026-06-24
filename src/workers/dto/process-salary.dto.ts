import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class ProcessSalaryDto {
  @ApiPropertyOptional({ example: true, description: 'Allow processing outside Saturday for testing' })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({ example: '2026-06-24', description: 'Salary payment date for individual worker processing' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 8000, description: 'Gross salary amount to process for an individual worker' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  grossAmount?: number;
}
