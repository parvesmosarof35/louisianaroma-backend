import { Controller, Post, Headers, Req, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { OrdersService } from './orders.service';

@Controller('orders/webhook')
export class WebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: express.Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Stripe signature header is missing.');
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is missing. Ensure rawBody is enabled in NestFactory options.');
    }

    await this.ordersService.handleStripeWebhook(rawBody, signature);

    return { received: true };
  }
}
