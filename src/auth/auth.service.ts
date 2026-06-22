import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface AuthResult {
  accessToken: string;
  user: {
    id: number;
    username: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersService.findByUsername(dto.username);
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username
      }
    };
  }

  getCookieOptions() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: isProduction,
      path: '/',
      maxAge: 8 * 60 * 60 * 1000
    };
  }
}
