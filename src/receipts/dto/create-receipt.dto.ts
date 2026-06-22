import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ReceiptItemDto } from './receipt-item.dto';

export class CreateReceiptDto {
  @ApiProperty({ example: 1, description: 'Client ID' })
  @Type(() => Number)
  @IsInt()
  clientId: number;

  @ApiPropertyOptional({ example: 1, description: 'Optional purchase order ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  purchaseOrderId?: number;

  @ApiProperty({ example: '2026-06-22', description: 'Issue date' })
  @IsDateString()
  issueDate: string;

  @ApiPropertyOptional({ example: 0, description: 'Tax amount in PKR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ example: 'Paid in cash', description: 'Receipt notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ReceiptItemDto], description: 'Receipt line items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  lineItems: ReceiptItemDto[];
}
