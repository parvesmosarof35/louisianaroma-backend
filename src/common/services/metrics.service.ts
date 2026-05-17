import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as os from 'os';
import * as fs from 'fs';

@Injectable()
export class MetricsService {
  private requestTimestamps: number[] = [];
  private totalLatency = 0;
  private totalRequests = 0;
  private successRequests = 0;
  private errorRequests = 0;

  constructor(private readonly prisma: PrismaService) {}

  recordRequest(latency: number, success: boolean) {
    const now = Date.now();
    this.requestTimestamps.push(now);
    this.totalRequests++;
    this.totalLatency += latency;
    if (success) {
      this.successRequests++;
    } else {
      this.errorRequests++;
    }

    // Retain metric history limit for 1 hour to prevent memory bloat
    const oneHourAgo = now - 60 * 60 * 1000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneHourAgo);
  }

  async getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const hitsMin = this.requestTimestamps.filter(t => t > oneMinuteAgo).length;
    const hitsHour = this.requestTimestamps.filter(t => t > oneHourAgo).length;

    // Database statistics
    let totalUsers = 0;
    let activeUsers = 0;
    try {
      totalUsers = await this.prisma.user.count();
      activeUsers = await this.prisma.user.count({ where: { status: 'active' } });
    } catch (e) {
      totalUsers = 0;
      activeUsers = 0;
    }

    // RAM usage metrics
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const totalMemGB = +(totalMemBytes / (1024 * 1024 * 1024)).toFixed(2);
    const usedMemGB = +(usedMemBytes / (1024 * 1024 * 1024)).toFixed(2);

    // CPU stats
    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU';
    const cpuLoad = +os.loadavg()[0].toFixed(2);

    // Storage filesystem specs
    let totalStorageGB = 50.0;
    let usedStorageGB = 10.0;
    try {
      const stats = fs.statfsSync('.');
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedBytes = totalBytes - freeBytes;
      totalStorageGB = +(totalBytes / (1024 * 1024 * 1024)).toFixed(2);
      usedStorageGB = +(usedBytes / (1024 * 1024 * 1024)).toFixed(2);
    } catch (e) {
      // Fallback
    }

    // Calculate latency metrics and success rates
    const avgLatency = this.totalRequests > 0 ? Math.round(this.totalLatency / this.totalRequests) : 0;
    const successRate = this.totalRequests > 0 ? +((this.successRequests / this.totalRequests) * 100).toFixed(2) : 100;

    return {
      uptimeHours: +(process.uptime() / 3600).toFixed(2),
      osPlatform: os.platform(),
      ram: {
        usedGB: usedMemGB,
        totalGB: totalMemGB,
        percent: +((usedMemBytes / totalMemBytes) * 100).toFixed(1),
      },
      cpu: {
        model: cpuModel,
        load1m: cpuLoad,
      },
      storage: {
        usedGB: usedStorageGB,
        totalGB: totalStorageGB,
        percent: +((usedStorageGB / totalStorageGB) * 100).toFixed(1),
      },
      traffic: {
        hitsMin,
        hitsHour,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      health: {
        avgLatencyMs: avgLatency,
        successRatePercent: successRate,
        errorCount: this.errorRequests,
      },
    };
  }
}
