import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { WebhookSignatureGuard } from "./guards/webhook-signature.guard";
import { SkipThrottle } from "@nestjs/throttler";

@Controller('webhooks')
@SkipThrottle()
export class SePayController {

    constructor(
        private readonly paymentsService: PaymentsService,
    ) { }

    @Post('sepay')
    @HttpCode(HttpStatus.OK)
    @UseGuards(WebhookSignatureGuard)
    async handleSepayWebhook(@Req() req: Request, @Body() body: any) {
        const rawBody = (req as any).rawBody;
        return this.paymentsService.handleIncomingWebhook(req.headers as any, body, rawBody);
    }
}
