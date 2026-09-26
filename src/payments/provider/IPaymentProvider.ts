export interface QrGenerationParams {
    amount: number;
    content: string; // transfer content (e.g., "DH12345678ABCD")
}

export interface QrGenerationResult {
    qrCode: string;       // QR code data (data URL or URL string)
    qrContent: string;    // raw QR content string for debugging
}

export interface WebhookVerificationResult {
    valid: boolean;
    reason?: string;
}

export interface WebhookTransactionData {
    content: string;        // transfer content to match
    amount: number;
    referenceCode: string;  // provider's transaction ID
    transactionDate?: Date;
}

export interface ProviderTransactionStatus {
    found: boolean;
    status?: 'success' | 'pending' | 'failed';
    amount?: number;
    referenceCode?: string;
}

export interface IPaymentProvider {
    getProviderName(): string;

    // Tạo giao dịch
    generateQr(params: QrGenerationParams): Promise<QrGenerationResult>;

    // Nhận webhook
    verifyWebhookSignature(headers: Record<string, string>, rawBody: Buffer): Promise<WebhookVerificationResult>;
    extractWebhookData(body: unknown): WebhookTransactionData;

    // Đối soát (reconciliation)
    checkTransactionStatus(referenceCode: string): Promise<ProviderTransactionStatus>;
}