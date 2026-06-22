import { ApiProperty } from '@nestjs/swagger';

export class SalaryPaymentResponseDto {
  @ApiProperty({ example: 1, description: 'Salary payment ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Worker ID' })
  workerId: number;

  @ApiProperty({ example: 'Ahmed Khan', description: 'Worker name' })
  workerName: string;

  @ApiProperty({ example: '2026-06-27', description: 'Payment date' })
  paymentDate: Date;

  @ApiProperty({ example: 4, description: 'Saturday week number in month' })
  weekNumber: number;

  @ApiProperty({ example: 15000, description: 'Gross amount' })
  grossAmount: number;

  @ApiProperty({ example: 5000, description: 'Advance deducted' })
  advanceDeducted: number;

  @ApiProperty({ example: 10000, description: 'Net amount paid' })
  netAmount: number;

  @ApiProperty({ example: 'Paid in cash', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
