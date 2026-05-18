import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { CustomBlendsModule } from './custom-blends/custom-blends.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { SettingModule } from './setting/setting.module';
import { FaqModule } from './faq/faq.module';
import { CollectionsModule } from './collections/collections.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MetricsService } from './common/services/metrics.service';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    IngredientsModule,
    CustomBlendsModule,
    OrdersModule,
    UsersModule,
    SettingModule,
    FaqModule,
    CollectionsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
