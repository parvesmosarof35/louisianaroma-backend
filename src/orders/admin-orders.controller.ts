import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AdminOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get(':id')
  async getAdminOrderDetails(@Param('id') id: string) {
    return this.ordersService.getAdminOrderDetails(id);
  }
}
