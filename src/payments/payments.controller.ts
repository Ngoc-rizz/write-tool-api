import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/strategies/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/decorators/current-user.decorator.js';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new payment with QR code' })
    @ApiResponse({ status: 201, description: 'Payment created successfully' })
    @ApiResponse({ status: 409, description: 'Active payment already exists for this order' })
    @ApiBearerAuth()
    create(@CurrentUser() user: JwtPayload, @Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentsService.createPayment(user.userId, createPaymentDto);
    }
    @Get(':id')
    @SkipThrottle()
    @UseGuards(JwtAuthGuard)
    async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
        const payment = await this.paymentsService.findById(id);
        if (payment.userId !== user.userId) throw new ForbiddenException();
        return payment;
    }
}
