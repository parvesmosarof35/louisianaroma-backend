import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('This email signature already holds active membership.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullname: dto.name || null,
        name: dto.name || null,
        image: dto.image || null,
        role: 'user',
        isVerify: true,
        status: 'active',
      },
    });

    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = this.signRefreshToken(user.id, user.email, user.role);

    return {
      success: true,
      message: 'Welcome back. Your personal curatorship profile has been established.',
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.isDelete) {
      throw new UnauthorizedException('These credentials do not align with any active member portfolio.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Incorrect password for this profile.');
    }

    const accessToken = this.signAccessToken(user.id, user.email, user.role);
    const refreshToken = this.signRefreshToken(user.id, user.email, user.role);

    return {
      success: true,
      message: 'Successfully Login',
      data: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub || payload.id },
      });

      if (!user || user.isDelete) {
        throw new UnauthorizedException('Invalid token credentials.');
      }

      const accessToken = this.signAccessToken(user.id, user.email, user.role);
      const refreshToken = this.signRefreshToken(user.id, user.email, user.role);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return {
      success: true,
      message: 'Successfully Find Single User',
      data: {
        _id: user.id,
        id: user.id,
        fullname: user.fullname,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isVerify: user.isVerify,
        role: user.role,
        status: user.status,
        photo: user.image,
        gender: user.gender,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode,
        createdAt: user.createdAt,
      },
    };
  }

  async updateProfile(userId: string, data: any, fileUrl?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const updateData: any = {};
    if (data.fullname) {
      updateData.fullname = data.fullname;
      updateData.name = data.fullname;
    }
    if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.postalCode !== undefined) updateData.postalCode = data.postalCode;
    if (data.gender || data.male) {
      updateData.gender = data.gender || data.male;
    }
    if (fileUrl) {
      updateData.image = fileUrl;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Successfully Change My Profile',
      data: {
        status: true,
        message: 'Successfully updated profile',
      },
    };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isDelete: true },
    });

    return {
      success: true,
      message: 'Successfully Deleted Your Account',
    };
  }

  async undoDeleteAccount(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDelete: false },
    });

    return {
      success: true,
      message: 'Successfully Restore your account ',
      data: {
        status: true,
        message: 'Account restored successfully',
      },
    };
  }

  private signAccessToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ id: userId, sub: userId, email, role }, { expiresIn: '10d' });
  }

  private signRefreshToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ id: userId, sub: userId, email, role }, { expiresIn: '30d' });
  }
}
