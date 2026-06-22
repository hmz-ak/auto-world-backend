import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Ahmed Khan', description: 'Worker name' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: '35202-1234567-1', description: 'CNIC' })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cnic?: string;

  @ApiPropertyOptional({ example: '03001234567', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Machine Operator', description: 'Factory role' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @ApiProperty({ example: 60000, description: 'Monthly salary in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlySalary: number;

  @ApiProperty({ example: '2026-06-01', description: 'Joining date' })
  @IsDateString()
  joiningDate: string;
}
