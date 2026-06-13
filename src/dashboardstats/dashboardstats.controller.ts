import { Controller, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { DashboardStatsService } from './dashboardstats.service';

@Controller('dashboardstats')
export class DashboardStatsController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get('get-stats')
  async getStats() {
    const stats = await this.dashboardStatsService.getStats();
    return {
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    };
  }

  @Get('user-growth')
  async getUserGrowth(@Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) year: number) {
    const growth = await this.dashboardStatsService.getUserGrowth(year);
    return {
      success: true,
      message: 'User growth data retrieved successfully',
      data: growth,
    };
  }

  @Get('recent-users')
  async getRecentUsers(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    const users = await this.dashboardStatsService.getRecentUsers(limit);
    return {
      success: true,
      message: 'Recent users retrieved successfully',
      data: users,
    };
  }

  @Get('consultants_total_services')
  async getConsultantTotalServices() {
    const res = await this.dashboardStatsService.getConsultantTotalServices();
    return {
      success: true,
      message: 'Consultant services retrieved successfully',
      data: res,
    };
  }

  @Get('consultants_total_clients')
  async getConsultantTotalClients() {
    const res = await this.dashboardStatsService.getConsultantTotalClients();
    return {
      success: true,
      message: 'Consultant clients retrieved successfully',
      data: res,
    };
  }

  @Get('consultants_total_earnings')
  async getConsultantTotalEarnings() {
    const res = await this.dashboardStatsService.getConsultantTotalEarnings();
    return {
      success: true,
      message: 'Consultant earnings retrieved successfully',
      data: res,
    };
  }

  @Get('consultants_served_clients')
  async getConsultantServedClients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const res = await this.dashboardStatsService.getConsultantServedClients(page, limit);
    return {
      success: true,
      message: 'Consultant served clients retrieved successfully',
      data: res,
    };
  }
}
