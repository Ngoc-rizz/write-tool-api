import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailService } from '@/email/email.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(private configService: ConfigService, private readonly prisma: PrismaService, private readonly emailService: EmailService, private jwtService: JwtService) { }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            })
            return this.generateTokens(payload.sub, payload.email)
        } catch {
            throw new UnauthorizedException('Require to login again')
        }
    }

    async register(dto: RegisterDTO) {
        const email = dto.email.trim().toLocaleLowerCase()

        if (await this.prisma.user.findUnique({
            where: {
                email
            }
        }))
            throw new BadRequestException(`Email already exists`)

        const hashPassword = await bcrypt.hash(dto.password, 12)

        const rawToken = randomInt(100000, 999999).toString()
        const verificationTokenHash = this.hashToken(rawToken)
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const user = await this.createUser(dto.name, email, hashPassword, verificationTokenHash, verificationTokenExpires)

        await this.emailService.sendVerificationEmail(email, rawToken)

        return { user }
    }

    async login(dto: LoginDto) {
        const email = dto.email.trim().toLocaleLowerCase()

        const user = await this.prisma.user.findUnique({
            where: {
                email
            }
        })

        const isPasswordValid = await bcrypt.compare(
            dto.password,
            user?.passwordHash ?? '$2b$12$000000000000000000000000000000000000000000000000000000'
        )

        if (!user || !isPasswordValid || !user.emailVerified)
            throw new UnauthorizedException('Invalid credentials')

        const tokens = this.generateTokens(user.id, user.email)

        return {
            tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                planType: user.planType,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        }
    }

    private async createUser(name: string, email: string, passwordHash: string, verificationTokenHash: string, verificationTokenExpires: Date) {
        return this.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                verificationTokenHash,
                verificationTokenExpires,
            },
            select: {
                id: true,
                name: true,
                email: true,
                planType: true,
                emailVerified: true,
                createdAt: true,
            }
        })
    }

    async verifyEmail(dto: VerifyEmailDto) {
        const tokenHash = this.hashToken(dto.token)

        const user = await this.prisma.user.findFirst({
            where: {
                verificationTokenHash: tokenHash,
                verificationTokenExpires: {
                    gt: new Date()
                }
            }
        });

        if (!user)
            throw new BadRequestException(`Invalid or expired verification code`)

        const updateUser = await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                emailVerified: new Date(),
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
            }
        })

        return updateUser
    }

    private hashToken = (token: string) => {
        return createHash('sha256').update(token).digest('hex')
    }

    private generateTokens(userId: string, email: string) {
        const payload: object = { sub: userId, email }

        const accessOptions: JwtSignOptions = {
            secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
            expiresIn: Number(this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES')),
        };

        const refreshOptions: JwtSignOptions = {
            secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
            expiresIn: Number(this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES')),
        };

        const accessToken = this.jwtService.sign(payload, accessOptions);
        const refreshToken = this.jwtService.sign(payload, refreshOptions);

        return { accessToken, refreshToken }
    }


}
