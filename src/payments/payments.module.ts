import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsService } from './payments.service.js';
import { PaymentsController } from './payments.controller.js';
import { SePayController } from './sepay.controller.js';
import { SepayProvider } from './provider/sepay.provider.js';
import { PaymentScheduler } from './payment.scheduler.js';
import { AuthModule } from '@/auth/auth.module.js';

// ─── Payments Module ────────────────────────────────────────────────
// Wires all payment components together.
// Uses SepayProvider for QR payments via VietQR / SePay.

@Module({
    imports: [
        ScheduleModule.forRoot(),
        AuthModule,
    ],
    controllers: [
        PaymentsController,
        SePayController,
    ],
    providers: [
        PaymentsService,
        PaymentScheduler,
        SepayProvider,
        {
            provide: 'PAYMENT_PROVIDER',
            useExisting: SepayProvider,
        },
    ],
    exports: [PaymentsService],
})
export class PaymentsModule { }
