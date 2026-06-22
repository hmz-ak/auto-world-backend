import { ApiProperty } from '@nestjs/swagger';

export class RevenueEntryResponseDto {
  @ApiProperty({ example: 1, description: 'Revenue entry ID' })
  id: number;

  @ApiProperty({ example: 1, nullable: true, description: 'Client ID' })
  clientId: number | null;

  @ApiProperty({ example: 'New Asia', nullable: true, description: 'Client name' })
  clientName: string | null;

  @ApiProperty({ example: 1, nullable: true, description: 'Receipt ID' })
  receiptId: number | null;

  @ApiProperty({ example: 'REC-20260622-0001', nullable: true, description: 'Receipt number' })
  receiptNumber: string | null;

  @ApiProperty({ example: 50000, description: 'Revenue amount' })
  amount: number;

  @ApiProperty({ example: 'Payment from New Asia', description: 'Description' })
  description: string;

  @ApiProperty({ example: '2026-06-22', description: 'Revenue date' })
  revenueDate: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}
