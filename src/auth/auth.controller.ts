import { Body, Controller, ForbiddenException, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { ConfigService } from '@nestjs/config';

const REFRESH_COOKIE_NAME = 'refreshToken';
const CSRF_COOKIE_NAME = 'csrfToken';
const AUTH_COOKIE_PATH = '/api/v1/auth';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly configService: ConfigService) { }

    private setAuthCookies(res: Response, refreshToken: string, csrfToken: string) {
        const isProd = this.configService.getOrThrow<string>('NODE_ENV') === 'production';

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: AUTH_COOKIE_PATH,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie(CSRF_COOKIE_NAME, csrfToken, {
            httpOnly: false,
            secure: isProd,
            sameSite: 'lax',
            path: AUTH_COOKIE_PATH,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    private clearAuthCookies(res: Response) {
        res.clearCookie(REFRESH_COOKIE_NAME, { path: AUTH_COOKIE_PATH });
        res.clearCookie(CSRF_COOKIE_NAME, { path: AUTH_COOKIE_PATH });
    }

    private checkCsrf(req: Request) {
        const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
        const headerToken = req.headers['x-csrf-token'];

        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            throw new ForbiddenException('CSRF token không hợp lệ');
        }
    }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký' })
    async register(@Body() dto: RegisterDTO) {
        return await this.authService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập' })
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { tokens, user } = await this.authService.login(dto);
        const csrfToken = this.authService.generateCsrfToken();

        this.setAuthCookies(res, tokens.refreshToken, csrfToken);

        return { accessToken: tokens.accessToken, csrfToken, user };
    }

    @Post('verify-email')
    @ApiOperation({ summary: 'Xác thực email' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return await this.authService.verifyEmail(dto);
    }

    @Post('resend-verification')
    @ApiOperation({ summary: 'Gửi lại mã xác thực email' })
    async resendVerification(@Body() dto: ResendVerificationDto) {
        return await this.authService.resendVerification(dto.email);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Gửi email đặt lại mật khẩu' })
    async forgotPassword(@Body() dto: ForgotPasswordDTO) {
        return await this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto.email, dto.token, dto.newPassword);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Làm mới access token bằng refresh token cookie' })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        this.checkCsrf(req);

        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!refreshToken) {
            throw new ForbiddenException('Không tìm thấy refresh token');
        }

        const payload = this.authService.verifyRefreshToken(refreshToken);
        const tokens = this.authService.generateTokens(payload.sub, payload.email);
        const csrfToken = this.authService.generateCsrfToken();

        this.setAuthCookies(res, tokens.refreshToken, csrfToken);

        return { accessToken: tokens.accessToken, csrfToken };
    }

    @Post('logout')
    @ApiOperation({ summary: 'Đăng xuất' })
    logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        this.checkCsrf(req);
        this.clearAuthCookies(res);
        return { message: 'Đã đăng xuất' };
    }
}