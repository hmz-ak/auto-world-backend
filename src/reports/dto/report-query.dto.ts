import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
