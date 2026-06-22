import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryResponseDto {
  @ApiProperty({ example: 150000, description: 'Revenue this month' })
  revenueThisMonth: number;

  @ApiProperty({ example: 75000, description: 'Expenses this month' })
  expensesThisMonth: number;

  @ApiProperty({ example: 75000, description: 'Net profit this month' })
  netProfitThisMonth: number;

  @ApiProperty({ example: 12, description: 'Active worker count' })
  activeWorkers: number;

  @ApiProperty({ example: 120000, description: 'Salary due this Saturday' })
  totalSalaryDueThisSaturday: number;

  @ApiProperty({ example: 2, description: 'Low stock inventory count' })
  inventoryItemsLowStock: number;

  @ApiProperty({ example: 1, description: 'Out of stock inventory count' })
  inventoryItemsOutOfStock: number;

  @ApiProperty({ example: 3, description: 'Pending order count' })
  pendingOrders: number;
}
