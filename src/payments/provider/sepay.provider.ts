import { Injectable } from "@nestjs/common";
import { IPaymentProvider, ProviderTransactionStatus, QrGenerationParams, QrGenerationResult, WebhookTransactionData, WebhookVerificationResult } from "./IPaymentProvider.js";
import { ConfigService } from "@nestjs/config";
import * as crypto from 'crypto';

@Injectable()
export class SepayProvider implements IPaymentProvider {
    constructor(private config: ConfigService) { }

    getProviderName(): string {
        return 'SEPAY';
    }

    async generateQr(params: QrGenerationParams): Promise<QrGenerationResult> {
        const bankBin = this.config.getOrThrow<string>('SEPAY_BANK_BIN')
        const accountNo = this.config.getOrThrow<string>('SEPAY_ACCOUNT_NO');

        const qrCode = `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(params.content)}`;

        return { qrCode, qrContent: `${bankBin}|${accountNo}|${params.amount}|${params.content}` };
    }

    async verifyWebhookSignature(headers: Record<string, string>,
        rawBody: Buffer,
    ): Promise<WebhookVerificationResult> {
        const secret = this.config.getOrThrow<string>('SEPAY_WEBHOOK_SECRET');
        const mode = this.config.get<string>('SEPAY_AUTH_MODE', 'apikey');

        if (mode === 'apikey') {
            const a = Buffer.from(headers['authorization'] ?? '');
            const b = Buffer.from(`Apikey ${secret}`);
            return a.length === b.length && crypto.timingSafeEqual(a, b)
                ? { valid: true }
                : { valid: false, reason: 'Invalid API key' };
        }


        const signature = headers['x-sepay-signature'];
        const timestamp = headers['x-sepay-timestamp'];
        if (!signature || !timestamp) {
            return { valid: false, reason: 'Missing signature or timestamp header' };
        }


        // Bước 1+2: ghép chuỗi {timestamp}.{raw_body}
        const payload = `${timestamp}.${rawBody.toString('utf-8')}`;
        // Bước 3: tính HMAC-SHA256
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        // So sánh — dùng timing-safe để tránh timing attack
        const expected = `sha256=${expectedSignature}`;
        const isValid =
            signature.length === expected.length &&
            crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        if (!isValid) {
            return { valid: false, reason: 'Signature mismatch' };
        }

        // Bảo vệ thêm — chống replay attack: từ chối nếu timestamp quá cũ (VD: >5 phút)
        const now = Math.floor(Date.now() / 1000);
        const ts = parseInt(timestamp, 10);
        if (Math.abs(now - ts) > 300) {
            return { valid: false, reason: 'Timestamp too old (possible replay attack)' };
        }

        return { valid: true };
    }

    extractWebhookData(body: unknown): WebhookTransactionData {
        const b = body as any;
        return {
            content: b.content,
            amount: b.transferAmount,
            referenceCode: String(b.id),
            transactionDate: b.transactionDate ? new Date(b.transactionDate) : undefined,
        };
    }

    async checkTransactionStatus(referenceCode: string): Promise<ProviderTransactionStatus> {
        // Gọi API SePay để tra cứu giao dịch thật (dùng cho reconciliation)
        const apiKey = this.config.getOrThrow<string>('SEPAY_API_KEY');

        const res = await fetch(`https://my.sepay.vn/userapi/transactions/details/${referenceCode}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!res.ok) {
            return { found: false };
        }

        const data = await res.json();
        return {
            found: true,
            status: 'success',
            amount: data.transaction?.amount_in,
            referenceCode,
        };
    }
}