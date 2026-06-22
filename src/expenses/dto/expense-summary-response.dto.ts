import { ApiProperty } from '@nestjs/swagger';

export class ExpenseCategoryTotalDto {
  @ApiProperty({ example: 'UTILITIES', description: 'Expense category' })
  category: string;

  @ApiProperty({ example: 25000, description: 'Category total' })
  total: number;
}

export class ExpenseDateRangeDto {
  @ApiProperty({ example: '2026-06-01', nullable: true, description: 'Start date' })
  from: string | null;

  @ApiProperty({ example: '2026-06-30', nullable: true, description: 'End date' })
  to: string | null;
}

export class ExpenseSummaryResponseDto {
  @ApiProperty({ example: 100000, description: 'Total expenses' })
  totalExpenses: number;

  @ApiProperty({ type: [ExpenseCategoryTotalDto], description: 'Totals grouped by category' })
  byCategory: ExpenseCategoryTotalDto[];

  @ApiProperty({ type: ExpenseDateRangeDto, description: 'Applied date range' })
  dateRange: ExpenseDateRangeDto;
}
