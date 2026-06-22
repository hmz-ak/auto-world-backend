import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ example: 'New Asia', description: 'Client company name' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Muhammad Ali', description: 'Primary contact person' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  contactPerson?: string;

  @ApiPropertyOptional({ example: '03001234567', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Lahore, Pakistan', description: 'Client address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the client is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
