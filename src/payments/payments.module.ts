import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SePayController } from './sepay.controller';
import { SepayProvider } from './provider/sepay.provider';
import { PaymentScheduler } from './payment.scheduler';
import { AuthModule } from '@/auth/auth.module';

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
