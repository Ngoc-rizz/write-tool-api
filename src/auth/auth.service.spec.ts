import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EmailService } from '@/email/email.service';

// Mock bcrypt at module level for ESM compatibility
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  hash: vi.fn(),
  compare: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const emailMock = {
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  };

  const configMock = {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') return 'access-secret';
      if (key === 'JWT_ACCESS_EXPIRES') return '3600';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES') return '86400';
      return 'mock-val';
    }),
  };

  const jwtMock = {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-1', email: 'iris@gmail.com' }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmailService, useValue: emailMock },
        { provide: ConfigService, useValue: configMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ──────────────────────────────────────────────

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-1',
        name: null,
        email: 'iris@gmail.com',
        planType: 'FREE',
        emailVerified: null,
        createdAt: new Date(),
      });

      const result = await service.register({
        name: 'Iris',
        email: 'Iris@gmail.com',
        password: '12345678',
      });

      // Should normalize email to lowercase
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'iris@gmail.com' },
      });
      // Should hash password with salt rounds = 12
      expect(bcrypt.hash).toHaveBeenCalledWith('12345678', 12);
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(emailMock.sendVerificationEmail).toHaveBeenCalledWith(
        'iris@gmail.com',
        expect.any(String),
      );
    });

    it('should reject duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'iris@gmail.com',
      });

      await expect(
        service.register({
          name: 'Iris',
          email: 'iris@gmail.com',
          password: '12345678',
        }),
      ).rejects.toThrow(new BadRequestException('Email already exists'));

      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  // ─── login ─────────────────────────────────────────────────

  describe('login', () => {
    const validUser = {
      id: 'user-1',
      email: 'iris@gmail.com',
      passwordHash: 'hashed-password',
      emailVerified: new Date(),
      name: 'Iris',
      planType: 'FREE',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    };

    it('should reject unknown email with generic message', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      // bcrypt.compare still runs against dummy hash (timing attack prevention)
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'unknown@gmail.com',
          password: '12345678',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));

      // Should still call bcrypt.compare to prevent timing attack
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should reject wrong password with generic message', async () => {
      prismaMock.user.findUnique.mockResolvedValue(validUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'iris@gmail.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should reject unverified email', async () => {
      const unverifiedUser = { ...validUser, emailVerified: null };
      prismaMock.user.findUnique.mockResolvedValue(unverifiedUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        service.login({
          email: 'iris@gmail.com',
          password: '12345678',
        }),
      ).rejects.toThrow(new UnauthorizedException('EMAIL_NOT_VERIFIED: Tài khoản chưa được xác thực email'));
    });

    it('should login successfully and return full user data', async () => {
      prismaMock.user.findUnique.mockResolvedValue(validUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        email: 'iris@gmail.com',
        password: '12345678',
      });

      expect(result).toEqual({
        tokens: {
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-jwt-token',
        },
        user: {
          id: validUser.id,
          email: validUser.email,
          name: validUser.name,
          planType: validUser.planType,
          emailVerified: validUser.emailVerified,
          createdAt: validUser.createdAt,
          updatedAt: validUser.updatedAt,
        },
      });
    });

    it('should normalize email to lowercase before lookup', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: '  IRIS@Gmail.COM  ',
          password: '12345678',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'iris@gmail.com' },
      });
    });
  });

  // ─── verifyEmail ───────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'iris@gmail.com',
      };

      const updatedUser = {
        id: 'user-1',
        name: 'Iris',
        email: 'iris@gmail.com',
        planType: 'FREE',
        emailVerified: new Date('2026-01-02'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.verifyEmail({ email: 'iris@gmail.com', token: 'valid-token' });

      // Should search by hashed token with expiry check
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'iris@gmail.com',
          verificationTokenHash: expect.any(String),
          verificationTokenExpires: { gt: expect.any(Date) },
        },
      });

      // Should clear token fields after verification
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          emailVerified: expect.any(Date),
          verificationTokenHash: null,
          verificationTokenExpires: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          planType: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual(updatedUser);
    });

    it('should reject invalid token', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'iris@gmail.com', token: 'invalid-token' }),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired verification code'),
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // findFirst returns null when token is expired (verificationTokenExpires < now)
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'iris@gmail.com', token: 'expired-token' }),
      ).rejects.toThrow(
        new BadRequestException('Invalid or expired verification code'),
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── resendVerification ─────────────────────────────────────

  describe('resendVerification', () => {
    it('should resend verification token for unverified user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'iris@gmail.com',
        emailVerified: null,
      });

      const result = await service.resendVerification('iris@gmail.com');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          verificationTokenHash: expect.any(String),
          verificationTokenExpires: expect.any(Date),
        },
      });

      expect(emailMock.sendVerificationEmail).toHaveBeenCalledWith(
        'iris@gmail.com',
        expect.any(String),
      );

      expect(result).toHaveProperty('message');
    });

    it('should throw error if user is already verified', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'iris@gmail.com',
        emailVerified: new Date(),
      });

      await expect(service.resendVerification('iris@gmail.com')).rejects.toThrow(
        new BadRequestException('Tài khoản đã được xác thực trước đó.'),
      );
    });
  });
});
