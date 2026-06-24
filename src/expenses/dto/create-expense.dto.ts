import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ExpenseCategory } from '../constants/expense.constants';

export class CreateExpenseDto {
  @ApiProperty({ enum: ExpenseCategory, description: 'Expense category' })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiPropertyOptional({ example: 'QUENCHING_OIL', description: 'Raw material/input subcategory when applicable' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  subCategory?: string;

  @ApiProperty({ example: 'Furnace fuel purchase', description: 'Description' })
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 25000, description: 'Expense amount in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-06-22', description: 'Expense date' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ example: 'Paid by cash', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
