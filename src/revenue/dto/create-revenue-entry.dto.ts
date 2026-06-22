import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRevenueEntryDto {
  @ApiPropertyOptional({ example: 1, description: 'Optional client ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  clientId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Optional receipt ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  receiptId?: number;

  @ApiProperty({ example: 50000, description: 'Revenue amount in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Payment from New Asia', description: 'Revenue description' })
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: '2026-06-22', description: 'Date money was received' })
  @IsDateString()
  revenueDate: string;
}
