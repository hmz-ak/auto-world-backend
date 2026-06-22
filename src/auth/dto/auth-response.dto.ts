import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'admin', description: 'Username' })
  username: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: AuthUserDto, description: 'Authenticated user' })
  user: AuthUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true, description: 'Whether logout completed' })
  loggedOut: boolean;
}
