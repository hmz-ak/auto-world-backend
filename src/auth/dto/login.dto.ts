import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Admin username' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  username: string;

  @ApiProperty({ example: 'admin123', description: 'Admin password' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}
