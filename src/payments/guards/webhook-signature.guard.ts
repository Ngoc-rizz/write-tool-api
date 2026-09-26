import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
    private readonly logger = new Logger(WebhookSignatureGuard.name);
    private readonly ipWhitelist: string[];

    constructor(private readonly configService: ConfigService) {
        const whitelist = this.configService.get<string>('WEBHOOK_IP_WHITELIST', '');
        this.ipWhitelist = whitelist
            ? whitelist.split(',').map((ip) => ip.trim())
            : [];
    }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const clientIp = request.ip || request.socket.remoteAddress || '';

        // If whitelist is configured, check IP
        if (this.ipWhitelist.length > 0) {
            const isAllowed = this.ipWhitelist.some(
                (allowed) => clientIp.includes(allowed),
            );

            if (!isAllowed) {
                this.logger.warn(`Webhook rejected: IP ${clientIp} not in whitelist`);
                throw new UnauthorizedException(`IP ${clientIp} not allowed`);
            }
        }

        this.logger.debug(`Webhook accepted from IP: ${clientIp}`);
        return true;
    }
}
