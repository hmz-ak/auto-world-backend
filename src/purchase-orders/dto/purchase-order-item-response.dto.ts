import { ApiProperty } from '@nestjs/swagger';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ example: 1, description: 'Purchase order item ID' })
  id: number;

  @ApiProperty({ example: '4-Patti Kamani', description: 'Product name' })
  productName: string;

  @ApiProperty({ example: 10, description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ example: 3500, description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ example: 35000, description: 'Line total' })
  totalPrice: number;
}
