import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/create-auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'mock-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLoginDto = {
        identifier: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        accessToken: 'mock-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const mockRequest = { user: mockUser };
      const result = await controller.login(mockRequest, mockLoginDto);

      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('googleAuthCallback', () => {
    it('should handle Google OAuth callback', async () => {
      const mockUser = {
        id: '1',
        email: 'google@example.com',
        username: 'googleuser',
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        accessToken: 'mock-token',
        user: mockUser,
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const mockRequest = { user: mockUser };
      const result = await controller.googleAuthCallback(mockRequest);

      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const mockRequest = { user: { id: '1' } };
      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith('1');
    });
  });
});
