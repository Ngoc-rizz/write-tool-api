import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Dành cho SePay
export class WebhookPayloadDto {
    @ApiProperty({ description: 'ID giao dịch tại SePay' })
    @IsNotEmpty()
    id: number;

    @ApiPropertyOptional({ description: 'Ngân hàng xử lý giao dịch' })
    @IsOptional()
    @IsString()
    gateway?: string;

    @ApiPropertyOptional({ description: 'Thời gian giao dịch' })
    @IsOptional()
    @IsString()
    transactionDate?: string;

    @ApiProperty({ description: 'Nội dung chuyển khoản — dùng để match với Payment.transferContent' })
    @IsNotEmpty()
    @IsString()
    content: string;

    @ApiProperty({ description: 'Số tiền giao dịch (VND)' })
    @IsNotEmpty()
    @IsInt()
    transferAmount: number;

    @ApiPropertyOptional({ description: 'Loại giao dịch: in (tiền vào) | out (tiền ra)' })
    @IsOptional()
    @IsIn(['in', 'out'])
    transferType?: string;

    @ApiPropertyOptional({ description: 'Mã tham chiếu từ ngân hàng, dùng làm idempotency key' })
    @IsOptional()
    @IsString()
    referenceCode?: string;
}