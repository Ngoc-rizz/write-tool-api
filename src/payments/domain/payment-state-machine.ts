export type PaymentStatus =
    | 'PENDING' | 'PROCESSING' | 'SUCCESS'
    | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

export type PaymentActor = 'system' | 'webhook' | 'admin' | 'user' | 'cron';

export interface TransitionResult {
    success: true;
    from: PaymentStatus;
    to: PaymentStatus;
}

export class InvalidTransitionError extends Error {
    constructor(
        public readonly from: PaymentStatus,
        public readonly to: PaymentStatus,
    ) {
        super(`Invalid payment transition: ${from} → ${to}`);
        this.name = 'InvalidTransitionError';
    }
}

const TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    PENDING: ['PROCESSING', 'EXPIRED', 'CANCELLED'],
    PROCESSING: ['SUCCESS', 'FAILED'],
    SUCCESS: ['REFUNDED'],
    FAILED: ['PENDING'],
    EXPIRED: [],
    CANCELLED: [],
    REFUNDED: [],
};

export const TERMINAL_STATES: ReadonlySet<PaymentStatus> = new Set([
    'EXPIRED', 'CANCELLED', 'REFUNDED',
]);

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: PaymentStatus, to: PaymentStatus): TransitionResult {
    if (!canTransition(from, to)) {
        throw new InvalidTransitionError(from, to);
    }
    return { success: true, from, to };
}

export function getNextStates(from: PaymentStatus): PaymentStatus[] {
    return TRANSITIONS[from] ?? [];
}

export function isTerminalState(status: PaymentStatus): boolean {
    return TERMINAL_STATES.has(status);
}