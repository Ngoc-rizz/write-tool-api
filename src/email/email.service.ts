import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemaider from 'nodemailer'
@Injectable()
export class EmailService {
    private transporter: nodemaider.Transporter;
    constructor(private config: ConfigService) {
        this.transporter = nodemaider.createTransport({
            service: 'gmail',
            auth: {
                user: this.config.get('GMAIL_USER'),
                pass: this.config.get('GMAIL_APP_PASSWORD'),
            },
        })
    }

    async sendVerificationEmail(to: string, token: string) {
        await this.transporter.sendMail({
            from: `"Writing Place" <${this.config.get('GMAIL_USER')}>`,
            to,
            subject: 'Xác thực email của bạn',
            html: `
                <h2>Chào mừng bạn!</h2>
                <p>Mã xác thực của bạn:</p>
                <h1 style="color: #4F46E5; letter-spacing: 4px;">${token}</h1>
                <p>Mã này hết hạn sau 24 giờ.</p>
            `,
        })
    }
}
