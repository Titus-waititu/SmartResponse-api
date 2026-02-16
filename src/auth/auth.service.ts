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
import { UAParser } from 'ua-parser-js';
import {
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/create-auth.dto';
import { UpdateProfileDto } from './dto/update-auth.dto';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Session) private sessionsRepository: Repository<Session>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(data, salt);
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const hashedRefreshToken = await this.hashData(refreshToken);

    // Parse device name from user agent
    const deviceName = this.parseDeviceName(userAgent);

    // Create new session
    const session = this.sessionsRepository.create({
      userId,
      hashedRefreshToken,
      ipAddress,
      userAgent,
      deviceName,
      isActive: true,
      lastActivity: new Date(),
    });

    const savedSession = await this.sessionsRepository.save(session);
    return savedSession.id;
  }

  private parseDeviceName(userAgent?: string): string {
    if (!userAgent) return 'Unknown Device';

    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();

      const device = result.device;
      const os = result.os;
      const browser = result.browser;

      // Priority 1: If device type is known (mobile, tablet, etc.)
      if (device.type) {
        if (device.vendor && device.model) {
          // e.g., "Apple iPhone 14" or "Samsung Galaxy S23"
          return `${device.vendor} ${device.model}`.trim();
        }
        if (device.vendor) {
          // e.g., "Apple Mobile" or "Samsung Tablet"
          return `${device.vendor} ${this.capitalizeFirst(device.type)}`.trim();
        }
        if (device.model) {
          // e.g., "iPhone" or "Galaxy S23"
          return device.model;
        }
        // e.g., "Mobile Device" or "Tablet"
        return `${this.capitalizeFirst(device.type)} Device`;
      }

      // Priority 2: Desktop - use OS and Browser
      if (os.name && browser.name) {
        // e.g., "Chrome on Windows 11" or "Safari on macOS"
        return `${browser.name} on ${os.name}${os.version ? ' ' + os.version : ''}`;
      }

      // Priority 3: OS only
      if (os.name) {
        return `${os.name}${os.version ? ' ' + os.version : ''} Device`;
      }

      // Priority 4: Browser only
      if (browser.name) {
        return `${browser.name} Browser`;
      }

      // Fallback
      return 'Unknown Device';
    } catch (error) {
      console.error('Error parsing user agent:', error);
      return 'Unknown Device';
    }
  }

  private capitalizeFirst(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  async getTokens(id: string, email: string, role: string, username: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          email: email,
          role: role,
          username: username,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: id,
          email: email,
          role: role,
          username: username,
        },
        {
          secret: this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_SECRET',
          ),
          expiresIn: this.configService.getOrThrow(
            'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
          ),
        },
      ),
    ]);
    return {
      accessToken: at,
      refreshToken: rt,
    };
  }

  async signIn(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'fullName',
        'role',
        'isActive',
        'username',
      ],
    });

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    if (user.isActive === false) {
      return {
        success: false,
        message: 'Account is inactive. Please contact support.',
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role,
      user.fullName,
    );

    const sessionId = await this.saveRefreshToken(
      user.id,
      tokens.refreshToken,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
      tokens: {
        ...tokens,
      },
      sessionId,
    };
  }

  async refreshTokens(id: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'fullName', 'role', 'username'],
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    // Find the session with matching refresh token
    const sessions = await this.sessionsRepository.find({
      where: { userId: id, isActive: true },
      select: ['id', 'hashedRefreshToken', 'userId'],
    });

    let validSession: Session | null = null;
    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        refreshToken,
        session.hashedRefreshToken,
      );
      if (isValid) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      return {
        success: false,
        message: 'Invalid refresh token or session expired',
      };
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role,
      user.username,
    );

    // Update the session with new refresh token and last activity
    const hashedRefreshToken = await this.hashData(tokens.refreshToken);
    await this.sessionsRepository.update(validSession.id, {
      hashedRefreshToken,
      lastActivity: new Date(),
    });

    return {
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }

  async logout(userId: string, sessionId?: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });

    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    if (sessionId) {
      // Logout from specific session
      const session = await this.sessionsRepository.findOne({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      await this.sessionsRepository.update(sessionId, {
        isActive: false,
      });

      return {
        success: true,
        message: 'Logged out from this device successfully',
      };
    } else {
      // Logout from all sessions (current device only - we'll need sessionId from token)
      // For now, just mark all sessions as inactive
      await this.sessionsRepository.update(
        { userId, isActive: true },
        { isActive: false },
      );

      return {
        success: true,
        message: 'Logout successful',
      };
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.updateUserPassword(userId, newPassword);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  generateResetToken(userId: string, email: string) {
    return this.jwtService.sign(
      { userId, email },
      {
        secret:
          this.configService.get<string>('JWT_RESET_TOKEN_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'reset-token-secret',
        expiresIn:
          this.configService.get('JWT_RESET_TOKEN_EXPIRATION_TIME') || '1h',
      },
    );
  }

  async verifyResetToken(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_RESET_TOKEN_SECRET') ||
          this.configService.get<string>('JWT_SECRET') ||
          'reset-token-secret',
      });
      const decodedEmail: string = decoded.email;
      const user = await this.usersRepository.findOne({
        where: { email: decodedEmail },
        select: ['id'],
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user.id;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return `Invalid or expired reset token: ${errorMessage}`;
    }
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.update(userId, { password: hashedPassword });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<string> {
    const { email } = forgotPasswordDto;
    const user = await this.usersRepository.findOne({
      where: { email },
      select: ['email', 'id'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    this.generateResetToken(user.id, user.email);
    // TODO: Send email with reset token
    // await this.mailService.sendResetEmail(email, token);
    return 'Password reset email sent successfully';
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<string> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new NotFoundException('Passwords do not match');
    }

    const userId = await this.verifyResetToken(token);
    if (!userId) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Get user email for confirmation email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['email'],
    });

    await this.updateUserPassword(userId, newPassword);

    // Send confirmation email
    if (user?.email) {
      try {
        // TODO: Send password reset success email
        // await this.mailService.sendPasswordResetSuccessEmail(user.email);
      } catch (error) {
        console.error(
          'Failed to send password reset confirmation email:',
          error,
        );
      }
    }

    return 'Password has been reset successfully';
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'fullName',
        'email',
        'role',
        'phoneNumber',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (updateProfileDto.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateProfileDto.email },
        select: ['id'],
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const hasChanges =
      updateProfileDto.fullName ||
      updateProfileDto.email ||
      updateProfileDto.phoneNumber;

    if (!hasChanges) {
      throw new BadRequestException('No fields to update');
    }

    await this.usersRepository.update(userId, updateProfileDto);

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'email', 'role'],
    });
    return user;
  }

  // Session Management Methods
  async getActiveSessions(userId: string) {
    const sessions = await this.sessionsRepository.find({
      where: { userId, isActive: true },
      select: [
        'id',
        'ipAddress',
        'userAgent',
        'deviceName',
        'isActive',
        'lastActivity',
        'createdAt',
      ],
      order: { lastActivity: 'DESC' },
    });

    return {
      success: true,
      message: 'Active sessions retrieved successfully',
      sessions: sessions.map((session) => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceName: session.deviceName,
        isActive: session.isActive,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
      })),
    };
  }

  async logoutFromSession(userId: string, sessionId: string) {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return {
        success: false,
        message: 'Session not found',
      };
    }

    await this.sessionsRepository.update(sessionId, {
      isActive: false,
    });

    return {
      success: true,
      message: 'Session terminated successfully',
    };
  }

  async logoutFromAllSessions(userId: string) {
    await this.sessionsRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );

    return {
      success: true,
      message: 'All sessions terminated successfully',
    };
  }
}
