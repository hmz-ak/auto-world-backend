import { ApiProperty } from '@nestjs/swagger';

export class ReceiptItemResponseDto {
  @ApiProperty({ example: 1, description: 'Receipt item ID' })
  id: number;

  @ApiProperty({ example: '4-Patti Kamani', description: 'Line item description' })
  description: string;

  @ApiProperty({ example: 10, description: 'Quantity' })
  quantity: number;

  @ApiProperty({ example: 3500, description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ example: 35000, description: 'Line total' })
  totalPrice: number;
}
