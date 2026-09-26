import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';

// ─── ⑩ Payment Scheduler ───────────────────────────────────────────
// Handles recurring tasks:
// - Expire stale PENDING payments every minute
// - Reconciliation check every hour (can be adjusted)

@Injectable()
export class PaymentScheduler {
    private readonly logger = new Logger(PaymentScheduler.name);

    constructor(private readonly paymentsService: PaymentsService) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handlePaymentExpiration() {
        this.logger.debug('Running payment expiration check...');
        try {
            const result = await this.paymentsService.expireOverduePayments();
            if (result.expired > 0) {
                this.logger.log(`Expired ${result.expired}/${result.total} stale payments`);
            }
        } catch (error: any) {
            this.logger.error(`Payment expiration job failed: ${error.message}`);
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleReconciliation() {
        this.logger.debug('Running payment reconciliation...');
        try {
            const result = await this.paymentsService.reconcileWithProvider();
            this.logger.log(`Reconciliation complete: ${result.results.length} payment(s) checked`);
        } catch (error: any) {
            this.logger.error(`Reconciliation job failed: ${error.message}`);
        }
    }
}
