import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateOrderStatusDto, UpdateOrderStatusSchema } from './orders.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrderStatus } from '@prisma/client';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async getAllOrders(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    let orderStatus: OrderStatus | undefined = undefined;
    if (status && ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      orderStatus = status as OrderStatus;
    }

    return this.ordersService.getAllOrders(orderStatus, pageNum, limitNum);
  }

  @Get(':id')
  async getAdminOrderDetails(@Param('id') id: string) {
    return this.ordersService.getAdminOrderDetails(id);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }
}
