import { ApiProperty } from '@nestjs/swagger';

export class RevenueDateRangeDto {
  @ApiProperty({ example: '2026-06-01', nullable: true, description: 'Start date' })
  from: string | null;

  @ApiProperty({ example: '2026-06-30', nullable: true, description: 'End date' })
  to: string | null;
}

export class RevenueSummaryResponseDto {
  @ApiProperty({ example: 150000, description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 3, description: 'Revenue entry count' })
  entryCount: number;

  @ApiProperty({ type: RevenueDateRangeDto, description: 'Applied date range' })
  dateRange: RevenueDateRangeDto;
}
