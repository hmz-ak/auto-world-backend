import { ApiProperty } from '@nestjs/swagger';
import { ClientResponseDto } from '../../clients/dto/client-response.dto';
import { ReceiptItemResponseDto } from './receipt-item-response.dto';

export class ReceiptResponseDto {
  @ApiProperty({ example: 1, description: 'Receipt ID' })
  id: number;

  @ApiProperty({ example: 'REC-20260622-0001', description: 'Receipt number' })
  receiptNumber: string;

  @ApiProperty({ type: ClientResponseDto, description: 'Client details' })
  client: ClientResponseDto;

  @ApiProperty({ example: 1, nullable: true, description: 'Linked purchase order ID' })
  purchaseOrderId: number | null;

  @ApiProperty({ example: 'PO-20260622-0001', nullable: true, description: 'Linked purchase order number' })
  purchaseOrderNumber: string | null;

  @ApiProperty({ example: '2026-06-22', description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ example: 35000, description: 'Subtotal' })
  subtotal: number;

  @ApiProperty({ example: 0, description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ example: 35000, description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ example: 'Paid in cash', nullable: true, description: 'Notes' })
  notes: string | null;

  @ApiProperty({ type: [ReceiptItemResponseDto], description: 'Receipt line items' })
  items: ReceiptItemResponseDto[];

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Updated timestamp' })
  updatedAt: Date;
}

export class ReceiptListItemDto {
  @ApiProperty({ example: 1, description: 'Receipt ID' })
  id: number;

  @ApiProperty({ example: 'REC-20260622-0001', description: 'Receipt number' })
  receiptNumber: string;

  @ApiProperty({ example: 1, description: 'Client ID' })
  clientId: number;

  @ApiProperty({ example: 'New Asia', description: 'Client name' })
  clientName: string;

  @ApiProperty({ example: 1, nullable: true, description: 'Linked purchase order ID' })
  purchaseOrderId: number | null;

  @ApiProperty({ example: 'PO-20260622-0001', nullable: true, description: 'Linked purchase order number' })
  purchaseOrderNumber: string | null;

  @ApiProperty({ example: '2026-06-22', description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ example: 35000, description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ example: 2, description: 'Line item count' })
  itemCount: number;
}
