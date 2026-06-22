import { ApiProperty } from '@nestjs/swagger';
import { ClientResponseDto } from '../../clients/dto/client-response.dto';
import { PurchaseOrderItemResponseDto } from './purchase-order-item-response.dto';

export class PurchaseOrderResponseDto {
  @ApiProperty({ example: 1, description: 'Purchase order ID' })
  id: number;

  @ApiProperty({ example: 'PO-20260622-0001', description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ type: ClientResponseDto, description: 'Client details' })
  client: ClientResponseDto;

  @ApiProperty({ example: '2026-06-22', description: 'Order date' })
  orderDate: Date;

  @ApiProperty({ example: '2026-06-30', nullable: true, description: 'Delivery date' })
  deliveryDate: Date | null;

  @ApiProperty({ example: 'PENDING', description: 'Order status' })
  status: string;

  @ApiProperty({ example: 35000, description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ example: 'Urgent order', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ type: [PurchaseOrderItemResponseDto], description: 'Line items' })
  items: PurchaseOrderItemResponseDto[];

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}

export class PurchaseOrderListItemDto {
  @ApiProperty({ example: 1, description: 'Purchase order ID' })
  id: number;

  @ApiProperty({ example: 'PO-20260622-0001', description: 'Order number' })
  orderNumber: string;

  @ApiProperty({ example: 1, description: 'Client ID' })
  clientId: number;

  @ApiProperty({ example: 'New Asia', description: 'Client name' })
  clientName: string;

  @ApiProperty({ example: '2026-06-22', description: 'Order date' })
  orderDate: Date;

  @ApiProperty({ example: '2026-06-30', nullable: true, description: 'Delivery date' })
  deliveryDate: Date | null;

  @ApiProperty({ example: 'PENDING', description: 'Order status' })
  status: string;

  @ApiProperty({ example: 35000, description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ example: 2, description: 'Line item count' })
  itemCount: number;
}
