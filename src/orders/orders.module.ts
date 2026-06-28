import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { WebhooksController, PaypalWebhooksController } from './webhooks.controller';
import { CustomBlendsModule } from '../custom-blends/custom-blends.module';
import { MailerService } from '../common/services/mailer.service';
import { ShippoService } from '../common/services/shippo.service';

@Module({
  imports: [CustomBlendsModule],
  controllers: [OrdersController, AdminOrdersController, WebhooksController, PaypalWebhooksController],
  providers: [OrdersService, MailerService, ShippoService],
  exports: [OrdersService],
})
export class OrdersModule {}
