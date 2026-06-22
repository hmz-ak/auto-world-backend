import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategoryTotalDto } from '../../expenses/dto/expense-summary-response.dto';

export class ProfitReportDateRangeDto {
  @ApiProperty({ example: '2026-06-01', nullable: true, description: 'Start date' })
  from: string | null;

  @ApiProperty({ example: '2026-06-30', nullable: true, description: 'End date' })
  to: string | null;
}

export class ProfitReportResponseDto {
  @ApiProperty({ type: ProfitReportDateRangeDto, description: 'Applied date range' })
  dateRange: ProfitReportDateRangeDto;

  @ApiProperty({ example: 150000, description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 50000, description: 'Total raw material cost' })
  totalRawMaterialCost: number;

  @ApiProperty({ example: 100000, description: 'Gross profit' })
  grossProfit: number;

  @ApiProperty({ example: 75000, description: 'Total operating expenses' })
  totalOperatingExpenses: number;

  @ApiProperty({ example: 25000, description: 'Net profit' })
  netProfit: number;

  @ApiProperty({ type: [ExpenseCategoryTotalDto], description: 'Expense breakdown' })
  expenseBreakdown: ExpenseCategoryTotalDto[];
}
