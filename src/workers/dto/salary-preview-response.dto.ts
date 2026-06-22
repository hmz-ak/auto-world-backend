import { ApiProperty } from '@nestjs/swagger';

export class SalaryPreviewItemDto {
  @ApiProperty({ example: 1, description: 'Worker ID' })
  workerId: number;

  @ApiProperty({ example: 'Ahmed Khan', description: 'Worker name' })
  workerName: string;

  @ApiProperty({ example: 15000, description: 'Weekly salary' })
  weeklySalary: number;

  @ApiProperty({ example: 5000, description: 'Pending advance' })
  pendingAdvance: number;

  @ApiProperty({ example: 10000, description: 'Net payment preview' })
  netPayment: number;
}

export class SalaryPreviewResponseDto {
  @ApiProperty({ example: '2026-06-27', description: 'Upcoming or current Saturday' })
  paymentDate: Date;

  @ApiProperty({ example: 4, description: 'Saturday week number in month' })
  weekNumber: number;

  @ApiProperty({ example: false, description: 'Whether today is Saturday' })
  isTodaySaturday: boolean;

  @ApiProperty({ type: [SalaryPreviewItemDto], description: 'Worker payment previews' })
  workers: SalaryPreviewItemDto[];

  @ApiProperty({ example: 150000, description: 'Total gross amount' })
  totalGross: number;

  @ApiProperty({ example: 25000, description: 'Total advance to deduct' })
  totalAdvanceToDeduct: number;

  @ApiProperty({ example: 125000, description: 'Total net amount' })
  totalNet: number;
}
