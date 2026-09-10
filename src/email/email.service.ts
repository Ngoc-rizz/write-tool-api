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
            from: `"NoReply - Writing Place" <${this.config.get('GMAIL_USER')}>`,
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

    async sendResetPasswordEmail(to: string, resetUrl: string) {
        await this.transporter.sendMail({
            from: `"NoReply - Writing Place" <${this.config.get('GMAIL_USER')}>`,
            to,
            subject: 'Đặt lại mật khẩu',
            html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Segoe UI', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:32px 40px 0 40px;">
                    <h1 style="font-size:20px; color:#18181b; margin:0 0 8px 0;">Đặt lại mật khẩu</h1>
                    <p style="font-size:14px; color:#52525b; line-height:1.6; margin:0 0 24px 0;">
                      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 40px 24px 40px;">
                    <a href="${resetUrl}"
                       style="display:inline-block; background-color:#18181b; color:#ffffff; text-decoration:none;
                              padding:12px 32px; border-radius:8px; font-size:14px; font-weight:600;">
                      Đặt lại mật khẩu
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 32px 40px;">
                    <p style="font-size:12px; color:#a1a1aa; line-height:1.6; margin:0;">
                      Liên kết có hiệu lực trong 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này — mật khẩu của bạn sẽ không bị thay đổi.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 40px; background:#fafafa; border-top:1px solid #f0f0f0;">
                    <p style="font-size:11px; color:#a1a1aa; margin:0;">© 2026 Mực & Giấy. Email này được gửi tự động, vui lòng không trả lời.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
        });
    }
}
