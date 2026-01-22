import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  // In-memory user store for demonstration
  // In production, replace this with a database (TypeORM, Prisma, etc.)
  private users: User[] = [];
  private userIdCounter = 1;

  constructor(private jwtService: JwtService) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    const { email, username, password, displayName } = registerDto;

    // Check if user already exists
    const existingUser = this.users.find(
      (u) => u.email === email || u.username === username,
    );
    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: User = {
      id: String(this.userIdCounter++),
      email,
      username,
      password: hashedPassword,
      displayName: displayName || username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);

    // Generate JWT token
    const accessToken = this.generateToken(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return { user: userWithoutPassword, accessToken };
  }

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<Omit<User, 'password'> | null> {
    // Find user by email or username
    const user = this.users.find(
      (u) => u.email === identifier || u.username === identifier,
    );

    if (!user || !user.password) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(
    user: User,
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    const accessToken = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }

  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    displayName: string;
    avatar?: string;
  }): Promise<User> {
    // Find user by Google ID or email
    let user = this.users.find(
      (u) => u.googleId === profile.googleId || u.email === profile.email,
    );

    if (!user) {
      // Create new user from Google profile
      user = {
        id: String(this.userIdCounter++),
        email: profile.email,
        username: profile.email.split('@')[0], // Generate username from email
        googleId: profile.googleId,
        displayName: profile.displayName,
        avatar: profile.avatar,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.push(user);
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = profile.googleId;
      user.avatar = profile.avatar || user.avatar;
      user.updatedAt = new Date();
    }

    return user;
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return null;
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
