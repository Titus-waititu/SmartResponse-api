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
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/create-auth.dto';
import { UpdateProfileDto } from './dto/update-auth.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(data, salt);
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersRepository.update(userId, {
      hashedRefreshToken: hashedRefreshToken,
    });
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

  async signUp(registerDto: RegisterDto) {
    const { email, password, fullName, phoneNumber, role, username } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await this.hashData(password);

    // Create user
    const user = this.usersRepository.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      role: role || UserRole.USER,
      isActive: true,
    });

    const savedUser: User = await this.usersRepository.save(user);

    // Generate tokens
    const tokens = await this.getTokens(
      savedUser.id,
      savedUser.email,
      savedUser.role,
      savedUser.username,
    );

    // Save refresh token
    await this.saveRefreshToken(savedUser.id, tokens.refreshToken);

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        username: savedUser.username,
        role: savedUser.role,
      },
      ...tokens,
    };
  }

  async signIn(loginDto: LoginDto) {
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
        'hashedRefreshToken',
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
    await this.saveRefreshToken(user.id, tokens.refreshToken);
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
    };
  }

  async refreshTokens(id: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'hashedRefreshToken',
        'username',
      ],
    });

    if (!user || !user.hashedRefreshToken) {
      return {
        success: false,
        message: 'User not found or not logged in',
      };
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!isRefreshTokenValid) {
      return {
        success: false,
        message: 'Invalid refresh token',
      };
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role,
      user.username,
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      ...tokens,
    };
  }

  async logout(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'hashedRefreshToken'],
    });

    if (!user || !user.hashedRefreshToken) {
      return {
        success: false,
        message: 'User not found or not logged in',
      };
    }

    await this.usersRepository.update(userId, {
      hashedRefreshToken: undefined,
    });
    return {
      success: true,
      message: 'Logout successful',
    };
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
        secret: this.configService.getOrThrow<string>('JWT_RESET_TOKEN_SECRET'),
        expiresIn: this.configService.getOrThrow(
          'JWT_RESET_TOKEN_EXPIRATION_TIME',
        ),
      },
    );
  }

  async verifyResetToken(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_RESET_TOKEN_SECRET'),
      }) as { email: string };
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
}
