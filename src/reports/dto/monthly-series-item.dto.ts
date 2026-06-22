import { ApiProperty } from '@nestjs/swagger';

export class MonthlySeriesItemDto {
  @ApiProperty({ example: 'Jan 2025', description: 'Month label' })
  month: string;

  @ApiProperty({ example: 150000, description: 'Monthly revenue' })
  revenue: number;

  @ApiProperty({ example: 75000, description: 'Monthly expenses' })
  expenses: number;

  @ApiProperty({ example: 75000, description: 'Monthly net profit' })
  netProfit: number;
}
