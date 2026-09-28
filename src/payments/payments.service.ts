import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { IPaymentProvider } from './provider/IPaymentProvider.js';

import {
    generateTransferContent,
    PAYMENT_EXPIRATION_MS,
    PlanType,
} from './domain/payment.types.js';
import { assertTransition, InvalidTransitionError, PaymentActor, PaymentStatus } from './domain/payment-state-machine.js';

const PLAN_PRICES: Record<PlanType, number> = {
    FREE: 0,
    PRO: 1000,
};

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject('PAYMENT_PROVIDER') private readonly provider: IPaymentProvider,
    ) { }

    // Tạo mới
    async createPayment(userId: string, dto: CreatePaymentDto) {
        const { idempotencyKey } = dto;

        const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey } })
        if (existing) {
            this.logger.log(`Idempotency hit: returning existing payment`)
            return existing;
        }

        const existingPending = await this.prisma.payment.findFirst({
            where: { userId, planType: dto.planType, status: { in: ['PENDING', 'PROCESSING'] } }
        })
        
        if (existingPending) return existingPending;

        const amount = PLAN_PRICES[dto.planType];
        const transferContent = generateTransferContent(userId);

        const qrData = await this.provider.generateQr({ amount, content: transferContent });

        const payment = await this.prisma.payment.create({
            data: {
                userId, planType: dto.planType, amount, transferContent,
                qrCode: qrData.qrCode, idempotencyKey,
                provider: this.provider.getProviderName() as any,
                status: 'PENDING',
                expiredAt: new Date(Date.now() + PAYMENT_EXPIRATION_MS),
            },
        });

        await this.createPaymentEvent(payment.id, 'PENDING', 'PENDING', 'Payment created', 'system');
        return payment;
    }

    // Đổi trạng thái
    async startProcessing(id: string, actor: PaymentActor, reason: string) {
        return this.transitionPayment(id, 'PROCESSING', actor, reason)
    }

    async confirmPayment(id: string, actor: PaymentActor, reason: string, metadata?: Record<string, any>) {
        return this.transitionPayment(id, 'SUCCESS', actor, reason, metadata);
    }

    async failPayment(id: string, actor: PaymentActor, reason: string) {
        return this.transitionPayment(id, 'FAILED', actor, reason);
    }

    async expirePayment(id: string, actor: PaymentActor = 'cron') {
        return this.transitionPayment(id, 'EXPIRED', actor, 'Timeout — no confirmation received');
    }

    async cancelPayment(id: string, actor: PaymentActor = 'user') {
        return this.transitionPayment(id, 'CANCELLED', actor, 'Cancelled by user');
    }

    private async transitionPayment(
        paymentId: string,
        toStatus: PaymentStatus,
        actor: PaymentActor,
        reason?: string,
        metadata?: Record<string, any>,
    ) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

        const fromStatus = payment.status as PaymentStatus;
        try {
            assertTransition(fromStatus, toStatus);
        } catch (error) {
            if (error instanceof InvalidTransitionError) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }

        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: toStatus,
                    ...(toStatus === 'SUCCESS' ? { paidAt: new Date() } : {}),
                },
            }),

            ...(toStatus === 'SUCCESS' && payment.planType === 'PRO' ? [
                this.prisma.user.update({
                    where: { id: payment.userId },
                    data: { role: 'PRO' },
                }),
            ] : []),

            this.prisma.paymentEvent.create({
                data: { paymentId, fromStatus, toStatus, reason, actor, metadata: metadata ?? undefined },
            }),
        ]);
        this.logger.log(`Payment ${paymentId}: ${fromStatus} → ${toStatus} (actor=${actor}, reason=${reason || 'n/a'})`);
        return updatedPayment;
    }

    // Xử lý webhook
    async handleIncomingWebhook(headers: Record<string, string>, body: unknown, rawPayload: Buffer) {
        const verification = await this.provider.verifyWebhookSignature(headers, rawPayload);

        if (!verification.valid) {
            this.logger.warn(`Webhook signature verification failed: ${verification.reason}`);
            throw new BadRequestException(`Invalid webhook signature: ${verification.reason}`);
        }

        const txData = this.provider.extractWebhookData(body);
        this.logger.log(`Webhook received: content=${txData.content}, amount=${txData.amount}, ref=${txData.referenceCode}`);

        const payment = await this.prisma.payment.findUnique({ where: { transferContent: txData.content } });
        if (!payment) {
            this.logger.warn(`Webhook: no payment found for transferContent=${txData.content}`);
            return { processed: false, reason: 'Payment not found' };
        }

        // Webhook gửi lại cho payment ĐÃ xử lý xong — coi là no-op, không phải lỗi
        if (payment.status === 'SUCCESS') {
            this.logger.log(`Payment ${payment.id} already SUCCESS — webhook redelivery, no-op`);
            return { processed: true, paymentId: payment.id, status: 'SUCCESS' };
        }

        // Chống race condition — bắt lỗi unique constraint nếu 2 webhook tới gần như đồng thời
        try {
            await this.prisma.paymentWebhookLog.create({
                data: { paymentId: payment.id, webhookId: txData.referenceCode, rawPayload: rawPayload as any, processed: false },
            });
        } catch (e: any) {
            if (e.code === 'P2002') {
                this.logger.log(`Webhook ${txData.referenceCode} already being processed (race condition)`);
                return { processed: false, reason: 'Duplicate webhook (race condition)' };
            }
            throw e;
        }

        if (txData.amount !== payment.amount) {
            this.logger.warn(`Webhook amount mismatch: expected=${payment.amount}, received=${txData.amount}`);

            await this.prisma.paymentWebhookLog.update({
                where: { webhookId: txData.referenceCode },
                data: { processed: false, error: `Amount mismatch: expected=${payment.amount}, received=${txData.amount}` },
            });
            await this.createPaymentEvent(payment.id, payment.status, payment.status, 'Amount mismatch', 'webhook');

            return { processed: false, reason: 'Amount mismatch' };
        }

        try {
            if (payment.status === 'PENDING') {
                await this.startProcessing(payment.id, 'webhook', 'Webhook received');
            }

            const updatedPayment = await this.confirmPayment(
                payment.id, 'webhook', `Confirmed via ${this.provider.getProviderName()}`,
                { referenceCode: txData.referenceCode },
            );

            await this.prisma.payment.update({
                where: { id: payment.id },
                data: { providerRef: txData.referenceCode },
            });

            await this.prisma.paymentWebhookLog.update({
                where: { webhookId: txData.referenceCode },
                data: { processed: true },
            });

            return { processed: true, paymentId: payment.id, status: updatedPayment.status };
        } catch (error: any) {
            this.logger.error(`Webhook processing failed for payment ${payment.id}: ${error.message}`);

            await this.prisma.paymentWebhookLog.update({
                where: { webhookId: txData.referenceCode },
                data: { processed: false, error: error.message },
            });

            return { processed: false, reason: error.message };
        }
    }

    // Batch jobs
    async expireOverduePayments() {
        const now = new Date();
        const overduePayments = await this.prisma.payment.findMany({
            where: { status: 'PENDING', expiredAt: { lte: now } },
        });

        let expiredCount = 0;
        for (const payment of overduePayments) {
            try {
                await this.expirePayment(payment.id);
                expiredCount++;
            } catch (error: any) {
                this.logger.error(`Failed to expire payment ${payment.id}: ${error.message}`);
            }
        }

        if (expiredCount > 0) {
            this.logger.log(`Expired ${expiredCount} overdue payment(s)`);
        }

        return { expired: expiredCount, total: overduePayments.length };
    }

    async reconcileWithProvider() {
        const cutoff = new Date(Date.now() - PAYMENT_EXPIRATION_MS);

        const suspiciousPayments = await this.prisma.payment.findMany({
            where: { status: { in: ['PROCESSING'] }, updatedAt: { lte: cutoff } },
        });

        const results: Array<{ paymentId: string; status: string; providerStatus: string; action: string }> = [];

        for (const payment of suspiciousPayments) {
            if (!payment.providerRef) {
                results.push({ paymentId: payment.id, status: payment.status, providerStatus: 'no_ref', action: 'skipped — no provider reference' });
                continue;
            }

            try {
                const providerStatus = await this.provider.checkTransactionStatus(payment.providerRef);

                if (!providerStatus.found) {
                    results.push({ paymentId: payment.id, status: payment.status, providerStatus: 'not_found', action: 'flagged — transaction not found at provider' });
                    continue;
                }

                if (providerStatus.status === 'success' && payment.status !== 'SUCCESS') {
                    await this.confirmPayment(payment.id, 'system', 'Reconciliation: confirmed by provider');
                    results.push({ paymentId: payment.id, status: payment.status, providerStatus: 'success', action: 'reconciled → SUCCESS' });
                } else if (providerStatus.status === 'failed') {
                    await this.failPayment(payment.id, 'system', 'Reconciliation: failed at provider');
                    results.push({ paymentId: payment.id, status: payment.status, providerStatus: 'failed', action: 'reconciled → FAILED' });
                } else {
                    results.push({ paymentId: payment.id, status: payment.status, providerStatus: providerStatus.status || 'unknown', action: 'no action needed' });
                }
            } catch (error: any) {
                this.logger.error(`Reconciliation error for ${payment.id}: ${error.message}`);
                results.push({ paymentId: payment.id, status: payment.status, providerStatus: 'error', action: `error: ${error.message}` });
            }
        }

        this.logger.log(`Reconciliation complete: ${results.length} payment(s) checked`);
        return { checkedAt: new Date(), results };
    }

    // Query
    async findById(id: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: { events: { orderBy: { createdAt: 'desc' } } },
        });
        if (!payment) throw new NotFoundException(`Payment ${id} not found`);

        if (payment.status === 'PENDING' && payment.expiredAt && new Date() > payment.expiredAt) {
            return this.expirePayment(payment.id, 'cron');
        }
        
        return payment;
    }

    async findByTransferContent(transferContent: string) {
        return this.prisma.payment.findUnique({ where: { transferContent } });
    }

    async findMyPayments(userId: string, filters?: { status?: PaymentStatus }) {
        return this.prisma.payment.findMany({
            where: { userId, ...(filters?.status ? { status: filters.status } : {}) },
            orderBy: { createdAt: 'desc' },
            include: { events: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
    }


    // Helpers
    private async createPaymentEvent(paymentId: string, fromStatus: string, toStatus: string, reason: string, actor: string) {
        return this.prisma.paymentEvent.create({ data: { paymentId, fromStatus, toStatus, reason, actor } });
    }

}
