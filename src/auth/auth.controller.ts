import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/create-auth.dto';
import { UpdateProfileDto } from './dto/update-auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';
import { GoogleOauthGuard } from './guards/google.oauth.guard';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.signIn(loginDto, ipAddress, userAgent);
  }

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  @Public()
  @UseGuards(JwtRefreshAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CurrentUser('userId') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }
  @Public()
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Guard will handle redirection
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('Google authentication failed');
      }

      const result = await this.authService.googleAuthRedirect(user);
      const { accessToken, refreshToken } = result.tokens;

      // Get frontend URL from environment or use default
      const baseFrontendUrl =
        process.env.FRONTEND_URL || 'http://localhost:8080';
      const frontendURL = new URL(`${baseFrontendUrl}/auth/google/callback`);

      // Add tokens and user info to query parameters
      frontendURL.searchParams.set('accessToken', accessToken);
      frontendURL.searchParams.set('refreshToken', refreshToken);
      frontendURL.searchParams.set('id', result.user.id);
      frontendURL.searchParams.set('role', result.user.role);
      frontendURL.searchParams.set('username', result.user.username);
      frontendURL.searchParams.set('email', result.user.email);

      // Redirect to frontend with tokens and user info in URL
      return res.redirect(frontendURL.toString());
    } catch (error) {
      console.error('Google callback error:', error);
      const baseFrontendUrl =
        process.env.FRONTEND_URL || 'http://localhost:8080';
      const errorUrl = new URL(`${baseFrontendUrl}/auth/error`);
      errorUrl.searchParams.set('message', 'Authentication failed');
      return res.redirect(errorUrl.toString());
    }
  }

  @Get('me')
  getMe(@Req() req: Request) {
    // `req.user` is populated by AtStrategy (global guard)
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // The JWT payload now contains: { sub, email, role, username }
    return {
      id: req.user['sub'],
      username: req.user['username'],
      email: req.user['email'],
      role: req.user['role'],
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('profile')
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @Get('sessions')
  async getActiveSessions(@CurrentUser('userId') userId: string) {
    return this.authService.getActiveSessions(userId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async logoutFromSession(
    @CurrentUser('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.logoutFromSession(userId, sessionId);
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  async logoutFromAllSessions(@CurrentUser('userId') userId: string) {
    return this.authService.logoutFromAllSessions(userId);
  }
}
