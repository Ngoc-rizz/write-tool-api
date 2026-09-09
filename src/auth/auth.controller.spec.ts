import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: vi.fn(),
    verifyEmail: vi.fn(),
    login: vi.fn()
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register', async () => {
      const registerDto = {
        name: 'Iris',
        email: 'iris@gmail.com',
        password: '12345678',
      };
      const serviceResult = {
        user: {
          id: 'user-1',
          name: 'Iris',
          email: 'iris@gmail.com',
        },
      };

      authServiceMock.register.mockResolvedValue(serviceResult);

      const result = await controller.register(registerDto);

      expect(authServiceMock.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(serviceResult);
    });
  });
  
  describe('login', () => {
    it('should call AuthService.login', async () => {
      const dto = {
        email: 'iris@gmail.com',
        password: '12345678',
      };

      const serviceResult = {
        user: {
          id: 'user-1',
          email: 'iris@gmail.com',
        },
      };

      authServiceMock.login.mockResolvedValue(
        serviceResult,
      );

      const result = await controller.login(dto);

      expect(
        authServiceMock.login,
      ).toHaveBeenCalledWith(dto);

      expect(result).toEqual(serviceResult);
    });
  });

  describe('verifyEmail', () => {
    it('should call AuthService.verifyEmail', async () => {
      const dto = {
        token: 'abc123',
      };

      const serviceResult = {
        user: {
          id: 'user-1',
          email: 'iris@gmail.com',
        },
      };

      authServiceMock.verifyEmail.mockResolvedValue(
        serviceResult,
      );

      const result =
        await controller.verifyEmail(dto);

      expect(
        authServiceMock.verifyEmail,
      ).toHaveBeenCalledWith(dto);

      expect(result).toEqual(serviceResult);
    });
  });
});
