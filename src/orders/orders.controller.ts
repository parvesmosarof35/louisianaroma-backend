import { Controller, Post, Get, Body, Param, UseGuards, UsePipes, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderSchema } from './orders.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import * as express from 'express';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateOrderSchema)) dto: CreateOrderDto,
    @Req() req: express.Request,
  ) {
    const order = await this.ordersService.createOrder(user.id, dto);
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
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.id);
  }

  @Get(':id')
  async getOrderDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderDetails(id, user.id);
  }
}
