import { Module } from '@nestjs/common';
import { CustomBlendsService } from './custom-blends.service';
import { CustomBlendsController } from './custom-blends.controller';

@Module({
  controllers: [CustomBlendsController],
  providers: [CustomBlendsService],
  exports: [CustomBlendsService],
})
export class CustomBlendsModule {}
