import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PurchaseOrderItemDto } from './purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 1, description: 'Client ID' })
  @Type(() => Number)
  @IsInt()
  clientId: number;

  @ApiProperty({ example: '2026-06-22', description: 'Order date' })
  @IsDateString()
  orderDate: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Expected delivery date' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'Urgent order', description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto], description: 'Line items' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  lineItems: PurchaseOrderItemDto[];
}
