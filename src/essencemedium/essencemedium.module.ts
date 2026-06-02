import { Module } from '@nestjs/common';
import { EssencemediumController } from './essencemedium.controller';
import { EssencemediumService } from './essencemedium.service';

@Module({
  controllers: [EssencemediumController],
  providers: [EssencemediumService],
  exports: [EssencemediumService],
})
export class EssencemediumModule {}
