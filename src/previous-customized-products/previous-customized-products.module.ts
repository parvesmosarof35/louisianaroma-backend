import { Module } from '@nestjs/common';
import { PreviousCustomizedProductsController } from './previous-customized-products.controller';
import { PreviousCustomizedProductsService } from './previous-customized-products.service';

@Module({
  controllers: [PreviousCustomizedProductsController],
  providers: [PreviousCustomizedProductsService],
  exports: [PreviousCustomizedProductsService],
})
export class PreviousCustomizedProductsModule {}
