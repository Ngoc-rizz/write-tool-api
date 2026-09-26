import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Delete,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/strategies/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtPayload } from '@/common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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


}
