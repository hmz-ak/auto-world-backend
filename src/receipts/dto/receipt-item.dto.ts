import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class ReceiptItemDto {
  @ApiProperty({ example: '4-Patti Kamani', description: 'Line item description' })
  @IsString()
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 10, description: 'Quantity sold' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 3500, description: 'Unit price in PKR' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}
