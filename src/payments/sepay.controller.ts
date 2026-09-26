import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { WebhookSignatureGuard } from "./guards/webhook-signature.guard";

@Controller('webhooks')
export class SePayController {

    constructor(
        private readonly paymentsService: PaymentsService,
    ) { }
    @Post('sepay')
    @UseGuards(WebhookSignatureGuard)
    async handleSepayWebhook(@Req() req: Request, @Body() body: any) {
        const rawBody = (req as any).rawBody;
        return this.paymentsService.handleIncomingWebhook(req.headers as any, body, rawBody);
    }
}