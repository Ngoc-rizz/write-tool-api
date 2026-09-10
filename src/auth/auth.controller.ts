import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ApiOperation } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDTO } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Đăng ký' })
    async register(@Body() dto: RegisterDTO) {
        return await this.authService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập' })
    async login(@Body() dto: LoginDto) {
        return await this.authService.login(dto);
    }

    @Post('verify-email')
    @ApiOperation({ summary: 'Xác thực email' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return await this.authService.verifyEmail(dto);
    }

    @Post('forgot-password')
    @ApiOperation({ summary: 'Gửi email đặt lại mật khẩu' })
    async forgotPassword(@Body() dto: ForgotPasswordDTO) {
        return await this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return await this.authService.resetPassword(dto.token, dto.newPassword);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Làm mới token' })
    refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

}
