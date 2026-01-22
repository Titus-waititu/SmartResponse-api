import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let authService: AuthService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL:
          'http://localhost:3000/api/v1/auth/google/callback',
      };
      return config[key];
    }),
  };

  const mockAuthService = {
    validateGoogleUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should validate and return user from Google profile', async () => {
      const mockProfile = {
        id: 'google-123',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        provider: 'google' as const,
        profileUrl: 'https://plus.google.com/google-123',
        _raw: '',
        _json: {} as any,
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'test',
        googleId: 'google-123',
        displayName: 'Test User',
        avatar: 'https://example.com/photo.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.validateGoogleUser.mockResolvedValue(mockUser);

      const done = jest.fn();
      await strategy.validate(
        {} as any,
        'access-token',
        'refresh-token',
        mockProfile,
        done,
      );

      expect(authService.validateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: 'https://example.com/photo.jpg',
      });
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });
  });
});
