import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '@app/core-lib';
import { RegisterDto, LoginUserDto, CreateUserDto } from '@app/database';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            generateTokens: jest.fn(),
            googleAuth: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should call authService.register with correct params', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
      };

      await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login with credentials', async () => {
      const credentials: LoginUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      await controller.login(credentials);
      expect(authService.login).toHaveBeenCalledWith(credentials);
    });
  });

  describe('refresh', () => {
    it('should call authService.generateTokens with userId', async () => {
      const userId = 'user-123';
      
      await controller.refresh(userId);
      expect(authService.generateTokens).toHaveBeenCalledWith(userId);
    });
  });

  describe('googleCallback', () => {
    it('should call authService.googleAuth with user data', async () => {
      const userData: CreateUserDto = {
        email: 'google@example.com',
        name: 'googleuser',
      };

      await controller.googleCallback(userData);
      expect(authService.googleAuth).toHaveBeenCalledWith(userData);
    });
  });
});