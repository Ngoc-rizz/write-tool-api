export const PAYMENT_EXPIRATION_MS = 15 * 60 * 1000;

export const TRANSFER_CONTENT_PREFIX = 'IV';

export type Currency = 'VND';

export type PlanType = 'FREE' | 'PRO';

export function generateTransferContent(orderId: string): string {
    const suffix = orderId.replace(/-/g, '').slice(-8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${TRANSFER_CONTENT_PREFIX}${suffix}${timestamp}`;
}

// chống trùng phía client gọi API tạo payment
export function generateIdempotencyKey(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 10);
    return `idem_${ts}_${rand}`;
}
