import { ApiProperty } from '@nestjs/swagger';

export class ManufacturingItemResponseDto {
  @ApiProperty({ example: '4L', description: 'Kamani type' })
  kamaniType: string;

  @ApiProperty({ example: 250, description: 'Quantity manufactured' })
  quantity: number;

  @ApiProperty({ example: 7.3, description: 'Weight per piece in kg' })
  unitWeight: number;

  @ApiProperty({ example: 1825, description: 'Total weight for this line in kg' })
  totalWeight: number;
}
