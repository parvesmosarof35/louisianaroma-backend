import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomAtelierService } from './custom-atelier.service';
import { CustomAtelierController } from './custom-atelier.controller';
import { AdminAtelierController } from './admin-atelier.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CustomAtelierController, AdminAtelierController],
  providers: [CustomAtelierService],
  exports: [CustomAtelierService],
})
export class CustomAtelierModule {}