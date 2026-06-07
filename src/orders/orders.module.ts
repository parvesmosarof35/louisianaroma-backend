import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { WebhooksController } from './webhooks.controller';
import { CustomBlendsModule } from '../custom-blends/custom-blends.module';

@Module({
  imports: [CustomBlendsModule],
  controllers: [OrdersController, AdminOrdersController, WebhooksController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
