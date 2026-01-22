import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('should register a new user successfully', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.username).toBe(registerDto.username);
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      await service.register(registerDto);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      await service.register(registerDto);

      const duplicateUsername = {
        ...registerDto,
        email: 'different@example.com',
      };

      await expect(service.register(duplicateUsername)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    const registerDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
    };

    beforeEach(async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      await service.register(registerDto);
    });

    it('should validate user with correct email and password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        registerDto.email,
        registerDto.password,
      );

      expect(result).toBeDefined();
      expect(result?.email).toBe(registerDto.email);
      expect(result).not.toHaveProperty('password');
    });

    it('should validate user with correct username and password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        registerDto.username,
        registerDto.password,
      );

      expect(result).toBeDefined();
      expect(result?.username).toBe(registerDto.username);
    });

    it('should return null for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        registerDto.email,
        'wrong-password',
      );

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const result = await service.validateUser(
        'nonexistent@example.com',
        'password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('mock-jwt-token');
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'google@example.com',
      displayName: 'Google User',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('should create new user from Google profile', async () => {
      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toBeDefined();
      expect(result.email).toBe(googleProfile.email);
      expect(result.googleId).toBe(googleProfile.googleId);
      expect(result.displayName).toBe(googleProfile.displayName);
    });

    it('should link existing user with Google account', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      await service.register({
        email: googleProfile.email,
        username: 'existinguser',
        password: 'password123',
      });

      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toBeDefined();
      expect(result.googleId).toBe(googleProfile.googleId);
      expect(result.email).toBe(googleProfile.email);
    });

    it('should return existing Google user', async () => {
      await service.validateGoogleUser(googleProfile);
      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toBeDefined();
      expect(result.googleId).toBe(googleProfile.googleId);
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const { user } = await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const result = await service.getProfile(user.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(user.id);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null for non-existent user', async () => {
      const result = await service.getProfile('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
