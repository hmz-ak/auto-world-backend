import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  AuthenticatedUser,
  CurrentUser
} from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthUserDto, LoginResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and set auth cookie' })
  @ApiResponse({ status: 201, type: LoginResponseDto, description: 'Authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<LoginResponseDto> {
    const result = await this.authService.login(dto);
    response.cookie('access_token', result.accessToken, this.authService.getCookieOptions());
    return result.response;
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and clear auth cookie' })
  @ApiResponse({ status: 200, type: LogoutResponseDto, description: 'Logged out' })
  logout(@Res({ passthrough: true }) response: Response): LogoutResponseDto {
    response.clearCookie('access_token', { path: '/' });
    return { loggedOut: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: AuthUserDto, description: 'Current user' })
  getMe(@CurrentUser() user: AuthenticatedUser): AuthUserDto {
    return this.authService.mapAuthenticatedUser(user);
  }
}
