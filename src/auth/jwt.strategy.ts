import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: any) => {
        const authHeader = req?.headers?.['authorization'];
        if (!authHeader) return null;
        // Support both "Bearer <token>" and raw "<token>"
        return authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : authHeader;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  async validate(payload: { sub?: string; id?: string; email: string; iat?: number }) {
    const userId = payload.sub || payload.id;
    if (!userId) {
      throw new UnauthorizedException('Token payload is missing user identification.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('The noble signature corresponding to this token is no longer recognized.');
    }

    // Invalidate tokens issued before the last password change (with a 10-second grace period to account for drift/timing latency)
    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedTime = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (passwordChangedTime - 10 > payload.iat) {
        throw new UnauthorizedException('The noble credentials have been altered. Please authenticate again.');
      }
    }

    return user;
  }
}
