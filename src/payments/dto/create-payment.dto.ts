import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PlanType } from '../domain/payment.types.js';

export class CreatePaymentDto {
    @ApiProperty({ description: 'Gói thành viên muốn nâng cấp', enum: ['FREE', 'PRO'], example: 'PRO' })
    @IsNotEmpty()
    @IsEnum(['FREE', 'PRO'])
    planType: PlanType;

    @ApiProperty({
        description: 'Idempotency key do client sinh, dùng để chống double-submit khi retry',
        example: 'idem_abc123xyz',
    })
    @IsNotEmpty()
    @IsString()
    idempotencyKey: string;
}