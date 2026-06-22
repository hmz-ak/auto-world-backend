import { ApiProperty } from '@nestjs/swagger';

export class AdvancePaymentResponseDto {
  @ApiProperty({ example: 1, description: 'Advance payment ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Worker ID' })
  workerId: number;

  @ApiProperty({ example: 'Ahmed Khan', description: 'Worker name' })
  workerName: string;

  @ApiProperty({ example: 5000, description: 'Advance amount' })
  amount: number;

  @ApiProperty({ example: 'Family emergency', nullable: true, description: 'Advance reason' })
  reason: string | null;

  @ApiProperty({ example: '2026-06-18', description: 'Advance date' })
  takenOn: Date;

  @ApiProperty({ example: false, description: 'Whether advance was deducted' })
  isDeducted: boolean;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
