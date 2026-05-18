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

  async validate(payload: { sub?: string; id?: string; email: string }) {
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
      },
    });

    if (!user) {
      throw new UnauthorizedException('The noble signature corresponding to this token is no longer recognized.');
    }

    return user;
  }
}
