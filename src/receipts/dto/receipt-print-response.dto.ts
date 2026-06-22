import { ApiProperty } from '@nestjs/swagger';
import { ReceiptResponseDto } from './receipt-response.dto';

export class ReceiptPrintResponseDto extends ReceiptResponseDto {
  @ApiProperty({ example: 'Auto World', description: 'Company name' })
  companyName: string;

  @ApiProperty({ example: 'Lahore, Pakistan', description: 'Company address' })
  companyAddress: string;

  @ApiProperty({ example: '+92-300-0000000', description: 'Company phone' })
  companyPhone: string;
}
