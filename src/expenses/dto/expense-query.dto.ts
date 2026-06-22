import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ExpenseCategory } from '../constants/expense.constants';

export class ExpenseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExpenseCategory, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
