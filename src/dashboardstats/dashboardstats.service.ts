import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    // 1. Get real counts from DB
    const totalUsers = await this.prisma.user.count();
    const activeBlends = await this.prisma.customBlend.count();
    const totalOrders = await this.prisma.order.count();
    const totalInquiries = await this.prisma.inquiry.count();
    const totalReviews = await this.prisma.review.count();

    // Calculate dynamic site interaction metrics based on actual DB records
    const siteVisits = totalUsers + activeBlends + totalOrders + totalInquiries + totalReviews;
    const uniqueVisitors = totalUsers + totalInquiries;

    // 2. Calculate dynamic trends (this week vs last week)
    const now = new Date();
    
    // Start of this week (Monday)
    const startOfThisWeek = new Date(now);
    const day = startOfThisWeek.getDay();
    const diff = startOfThisWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfThisWeek.setDate(diff);
    startOfThisWeek.setHours(0, 0, 0, 0);

    // Start of last week
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Users trend
    const usersThisWeek = await this.prisma.user.count({ where: { createdAt: { gte: startOfThisWeek } } });
    const usersLastWeek = await this.prisma.user.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } });
    const totalUsersTrend = this.calculateTrend(usersThisWeek, usersLastWeek);

    // Active blends trend
    const blendsThisWeek = await this.prisma.customBlend.count({ where: { createdAt: { gte: startOfThisWeek } } });
    const blendsLastWeek = await this.prisma.customBlend.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } });
    const activeBlendsTrend = this.calculateTrend(blendsThisWeek, blendsLastWeek);

    // Unique visitors trend
    const inquiriesThisWeek = await this.prisma.inquiry.count({ where: { createdAt: { gte: startOfThisWeek } } });
    const inquiriesLastWeek = await this.prisma.inquiry.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } });
    const uniqueVisitorsThisWeek = usersThisWeek + inquiriesThisWeek;
    const uniqueVisitorsLastWeek = usersLastWeek + inquiriesLastWeek;
    const uniqueVisitorsTrend = this.calculateTrend(uniqueVisitorsThisWeek, uniqueVisitorsLastWeek);

    // Site visits trend
    const ordersThisWeek = await this.prisma.order.count({ where: { createdAt: { gte: startOfThisWeek } } });
    const ordersLastWeek = await this.prisma.order.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } });
    const reviewsThisWeek = await this.prisma.review.count({ where: { createdAt: { gte: startOfThisWeek } } });
    const reviewsLastWeek = await this.prisma.review.count({ where: { createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } } });
    
    const visitsThisWeek = usersThisWeek + blendsThisWeek + ordersThisWeek + inquiriesThisWeek + reviewsThisWeek;
    const visitsLastWeek = usersLastWeek + blendsLastWeek + ordersLastWeek + inquiriesLastWeek + reviewsLastWeek;
    const siteVisitsTrend = this.calculateTrend(visitsThisWeek, visitsLastWeek);

    // 3. User growth and site visits per day for current week
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const userGrowth: { label: string; value: number }[] = [];
    const siteVisitsChart: { label: string; value: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfThisWeek);
      dayStart.setDate(startOfThisWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Count actual users created on this day
      const growthCount = await this.prisma.user.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });

      // Count actual interactions (visits) on this day
      const dayBlends = await this.prisma.customBlend.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
      const dayOrders = await this.prisma.order.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
      const dayInquiries = await this.prisma.inquiry.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
      const dayReviews = await this.prisma.review.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
      
      const dayVisits = growthCount + dayBlends + dayOrders + dayInquiries + dayReviews;

      userGrowth.push({
        label: days[i],
        value: growthCount,
      });

      siteVisitsChart.push({
        label: days[i],
        value: dayVisits,
      });
    }

    // 4. Views, Cart, Sales values & conversion rate
    const viewsValue = siteVisits >= 1000 ? `${(siteVisits / 1000).toFixed(1)}K` : `${siteVisits}`;
    const cartValue = activeBlends >= 1000 ? `${(activeBlends / 1000).toFixed(1)}K` : `${activeBlends}`;
    const salesValue = totalOrders >= 1000 ? `${(totalOrders / 1000).toFixed(1)}K` : `${totalOrders}`;
    const conversionRate = siteVisits > 0 ? `${((totalOrders / siteVisits) * 100).toFixed(1)}%` : "0.0%";

    // 5. Masterpiece Popularity (Top products based on actual orders)
    const orderItemsGroup = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _count: {
        productId: true,
      },
      where: {
        productId: { not: null },
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 5,
    });

    const topProducts: { label: string; value: number }[] = [];

    for (const item of orderItemsGroup) {
      if (item.productId) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (product) {
          topProducts.push({
            label: product.name,
            value: item._count.productId,
          });
        }
      }
    }

    // If we have less than 5 products from order items, fill in with other products in the DB
    if (topProducts.length < 5) {
      const remainingCount = 5 - topProducts.length;
      const existingIds = orderItemsGroup.map(item => item.productId).filter(Boolean);
      const remainingProducts = await this.prisma.product.findMany({
        where: {
          id: { notIn: existingIds as string[] },
        },
        take: remainingCount,
      });

      for (const product of remainingProducts) {
        topProducts.push({
          label: product.name,
          value: 0,
        });
      }
    }

    // 6. Recent Submissions (Most recent user signups)
    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const recentSubmissions = recentUsers.map(user => ({
      id: `USR-${user.id.toString().slice(-4).toUpperCase()}`,
      name: user.fullname || user.name || user.email.split('@')[0],
      status: user.isVerify ? 'Validated' : 'Pending',
    }));

    return {
      totalUsers,
      totalUsersTrend,
      uniqueVisitors,
      uniqueVisitorsTrend,
      siteVisits,
      siteVisitsTrend,
      activeBlends,
      activeBlendsTrend,
      userGrowth,
      siteVisitsChart,
      conversionRate,
      views: viewsValue,
      cart: cartValue,
      sales: salesValue,
      topProducts,
      recentSubmissions,
    };
  }

  private calculateTrend(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? "+100%" : "+0%";
    }
    const diff = current - previous;
    const change = (diff / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  }

  async getUserGrowth(year: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growth: { label: string; value: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(year, i, 1),
            lt: new Date(year, i + 1, 1),
          },
        },
      });
      growth.push({
        label: months[i],
        value: count,
      });
    }
    return growth;
  }

  async getRecentUsers(limit: number) {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return users.map(user => ({
      id: user.id,
      name: user.fullname || user.name || user.email.split('@')[0],
      email: user.email,
      status: user.status,
      joinDate: user.createdAt.toLocaleDateString(),
    }));
  }

  async getConsultantTotalServices() {
    return { count: 0 };
  }

  async getConsultantTotalClients() {
    return { count: 0 };
  }

  async getConsultantTotalEarnings() {
    return { total: 0 };
  }

  async getConsultantServedClients(page: number, limit: number) {
    return { clients: [], total: 0, page, limit };
  }
}
