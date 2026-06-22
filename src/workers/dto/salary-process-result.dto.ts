import { ApiProperty } from '@nestjs/swagger';
import { SalaryPaymentResponseDto } from './salary-payment-response.dto';

export class SalaryProcessResultDto {
  @ApiProperty({ example: 10, description: 'Processed worker count' })
  processed: number;

  @ApiProperty({ example: 150000, description: 'Total gross salary processed' })
  totalGrossPaid: number;

  @ApiProperty({ example: 25000, description: 'Total advance deducted' })
  totalAdvanceDeducted: number;

  @ApiProperty({ example: 125000, description: 'Total net paid' })
  totalNetPaid: number;

  @ApiProperty({ example: '2026-06-27', description: 'Payment date' })
  paymentDate: Date;

  @ApiProperty({ type: [SalaryPaymentResponseDto], description: 'Created salary payments' })
  payments: SalaryPaymentResponseDto[];
}
