import { Controller, Post, Headers, Req, Body, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
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

  @Post('shippo')
  @HttpCode(HttpStatus.OK)
  async handleShippoWebhook(@Body() body: any) {
    await this.ordersService.handleShippoWebhook(body);
    return { received: true };
  }
}

@Controller('webhooks')
export class PaypalWebhooksController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePaypalWebhook(
    @Req() req: express.Request,
    @Headers() headers: Record<string, string>,
  ) {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is missing. Ensure rawBody is enabled in NestFactory options.');
    }

    const payloadStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

    await this.ordersService.handlePaypalWebhook(headers, payloadStr);

    return { received: true };
  }
}
