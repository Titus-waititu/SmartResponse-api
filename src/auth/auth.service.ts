import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UserRole,
} from './dto/create-auth.dto';
import { UpdateProfileDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signUp(registerDto: RegisterDto): Promise<TokenResponse> {
    const { email, password, fullName, phoneNumber, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const userId = crypto.randomUUID();
    const userRole = role || UserRole.USER;

    await this.databaseService['sql']`
      INSERT INTO users (id, full_name, email, password, phone_number, role, is_active, created_at, updated_at)
      VALUES (${userId}, ${fullName}, ${email}, ${hashedPassword}, ${phoneNumber || null}, ${userRole}, true, NOW(), NOW())
    `;

    // Generate tokens
    const tokens = await this.generateTokens(userId, email, userRole);

    // Save refresh token
    await this.updateRefreshToken(userId, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: userId,
        email,
        fullName,
        role: userRole,
      },
    };
  }

  async signIn(loginDto: LoginDto): Promise<TokenResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<Omit<TokenResponse, 'user'>> {
    const user = await this.validateUserById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.validateUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.databaseService['sql']`
      UPDATE users
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${userId}
    `;

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If an account exists, a password reset link has been sent',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token
    await this.databaseService['sql']`
      UPDATE users
      SET reset_password_token = ${hashedToken}, reset_password_expires = ${expiresAt}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // TODO: Send email with reset token
    // For now, return the token (in production, send via email)
    console.log('Reset token:', resetToken);

    return {
      message: 'If an account exists, a password reset link has been sent',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Find user with valid reset token
    const users = await this.databaseService['sql']`
      SELECT * FROM users
      WHERE reset_password_token IS NOT NULL
      AND reset_password_expires > NOW()
    `;

    let validUser: User | null = null;
    for (const user of users) {
      const isTokenValid = await bcrypt.compare(
        token,
        user.reset_password_token,
      );
      if (isTokenValid) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.databaseService['sql']`
      UPDATE users
      SET password = ${hashedPassword}, 
          reset_password_token = NULL, 
          reset_password_expires = NULL,
          updated_at = NOW()
      WHERE id = ${validUser.id}
    `;

    return { message: 'Password reset successfully' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.databaseService['sql']`
      UPDATE users
      SET refresh_token = NULL, updated_at = NOW()
      WHERE id = ${userId}
    `;

    return { message: 'Logged out successfully' };
  }

  async getProfile(
    userId: string,
  ): Promise<Omit<User, 'password' | 'refreshToken' | 'resetPasswordToken'>> {
    const user = await this.validateUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, resetPasswordToken, ...profile } = user;
    return profile;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    const updates: string[] = [];
    const values: any[] = [];

    if (updateProfileDto.fullName) {
      updates.push('full_name = $' + (values.length + 1));
      values.push(updateProfileDto.fullName);
    }
    if (updateProfileDto.email) {
      // Check if email is already taken
      const existingUser = await this.findByEmail(updateProfileDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      updates.push('email = $' + (values.length + 1));
      values.push(updateProfileDto.email);
    }
    if (updateProfileDto.phoneNumber) {
      updates.push('phone_number = $' + (values.length + 1));
      values.push(updateProfileDto.phoneNumber);
    }

    if (updates.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    await this.databaseService['sql']`
      UPDATE users
      SET ${this.databaseService['sql'](updates.join(', '))}
      WHERE id = ${userId}
    `;

    return { message: 'Profile updated successfully' };
  }

  // Helper methods
  async validateUserById(userId: string): Promise<User | null> {
    const result = await this.databaseService['sql']`
      SELECT * FROM users WHERE id = ${userId}
    `;
    return result[0] || null;
  }

  private async findByEmail(email: string): Promise<User | null> {
    const result = await this.databaseService['sql']`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0] || null;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret:
            this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ||
            'your-refresh-secret-key',
          expiresIn:
            this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.databaseService['sql']`
      UPDATE users
      SET refresh_token = ${hashedRefreshToken}, updated_at = NOW()
      WHERE id = ${userId}
    `;
  }
}
