import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'admin', description: 'Unique username' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Plain password to hash' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
