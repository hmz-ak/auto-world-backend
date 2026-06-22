import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAdvanceDto {
  @ApiProperty({ example: 5000, description: 'Advance amount in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Family emergency', description: 'Advance reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: '2026-06-18', description: 'Date advance was taken' })
  @IsDateString()
  takenOn: string;
}
