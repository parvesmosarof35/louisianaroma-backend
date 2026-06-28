import { Controller, Post, Get, Body, Param, UseGuards, UsePipes, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderSchema } from './orders.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as express from 'express';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async createOrder(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateOrderSchema)) dto: CreateOrderDto,
    @Req() req: express.Request,
  ) {
    const order = await this.ordersService.createOrder(user?.id || null, dto);
    
    if (dto.paymentMethod === 'paypal') {
      return {
        success: true,
        message: 'Luxury order initiated via PayPal. Awaiting payment verification.',
        data: order,
      };
    }

    const origin = req.get('origin') || 'http://localhost:3000';
    const checkoutUrl = await this.ordersService.createStripeCheckoutSession(order, origin);
    return {
      success: true,
      message: 'Luxury order initiated.',
      data: order,
      checkoutUrl,
    };
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderDetails(id, user.id);
  }
}
