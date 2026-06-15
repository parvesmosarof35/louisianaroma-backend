import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Synchronize super admin user from .env securely on startup without wiping DB
  async onModuleInit() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASS;

    if (email && password) {
      try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await this.prisma.user.upsert({
          where: { email },
          update: {
            password: hashedPassword,
            role: 'superadmin',
            isVerify: true,
            status: 'active',
          },
          create: {
            email,
            name: 'Super Admin',
            password: hashedPassword,
            role: 'superadmin',
            isVerify: true,
            status: 'active',
          },
        });
        console.log(`⚜️ Super admin synchronized successfully: ${email}`);
      } catch (error) {
        console.error('Error synchronizing super admin:', error);
      }
    }
  }
}
