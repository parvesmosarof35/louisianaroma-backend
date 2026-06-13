import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardStatsController } from './dashboardstats.controller';
import { DashboardStatsService } from './dashboardstats.service';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardStatsController],
  providers: [DashboardStatsService],
  exports: [DashboardStatsService],
})
export class DashboardStatsModule {}
