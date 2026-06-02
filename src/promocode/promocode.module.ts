import { Module } from '@nestjs/common';
import { PromocodeController } from './promocode.controller';
import { PromocodeService } from './promocode.service';

@Module({
  controllers: [PromocodeController],
  providers: [PromocodeService],
  exports: [PromocodeService],
})
export class PromocodeModule {}
