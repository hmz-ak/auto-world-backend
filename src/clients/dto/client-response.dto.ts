import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: 1, description: 'Client ID' })
  id: number;

  @ApiProperty({ example: 'New Asia', description: 'Client company name' })
  name: string;

  @ApiProperty({ example: 'Ali Khan', nullable: true, description: 'Contact person' })
  contactPerson: string | null;

  @ApiProperty({ example: '03001234567', nullable: true, description: 'Phone number' })
  phone: string | null;

  @ApiProperty({ example: 'Lahore, Pakistan', nullable: true, description: 'Address' })
  address: string | null;

  @ApiProperty({ example: true, description: 'Active state' })
  isActive: boolean;

  @ApiProperty({ example: '2026-06-22T10:00:00.000Z', description: 'Created timestamp' })
  createdAt: Date;
}
