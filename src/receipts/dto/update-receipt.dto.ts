import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateReceiptDto {
  @ApiPropertyOptional({ example: '2026-06-22', description: 'Issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Receipt notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
