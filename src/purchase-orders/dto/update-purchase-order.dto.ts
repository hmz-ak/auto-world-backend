import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PurchaseOrderStatus } from '../constants/purchase-order.constants';

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional({ enum: PurchaseOrderStatus, description: 'Order status' })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Delivery date' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
