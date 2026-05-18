import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../common/services/mailer.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UserVerificationDto, ChangePasswordDto, ForgotPasswordDto, VerificationForgotUserDto, ResetPasswordDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  async create_user(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Email credentials are already enrolled in our catalog.');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.user.create({
      data: {
        fullname: dto.fullname,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires: expiresAt,
        isVerify: false,
        status: 'isProgress',
      },
    });

    // Dispatch verification code securely
    await this.mailerService.sendVerificationCode(dto.email, verificationCode);

    return {
      success: true,
      message: 'Successfully Register New User',
      data: {
        status: true,
        message: 'Check your email inbox', 
      },
    };
  }

  async user_verification(dto: UserVerificationDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationCode: dto.verificationCode,
        verificationCodeExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Verification code is invalid or has expired.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerify: true,
        verificationCode: null,
        verificationCodeExpires: null,
        status: 'active',
      },
    });

    // Issue luxury accessToken
    const payload = { id: updatedUser.id, role: updatedUser.role, email: updatedUser.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Successfully Varified Your Account',
      data: {
        message: 'User verification successful',
        accessToken,
      },
    };
  }

  async change_password(userId: string, dto: ChangePasswordDto) {
    if (!userId) {
      throw new BadRequestException('Unable to identify your account. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const matched = await bcrypt.compare(dto.oldpassword, user.password);
    if (!matched) {
      throw new BadRequestException('Your current password is incorrect. Please try again.');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(dto.newpassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Successfully updated your security password.',
    };
  }

  async forgot_password(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException('No registered account was matched with this email.');
    }

    // Generate code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpires: expiresAt,
      },
    });

    await this.mailerService.sendVerificationCode(dto.email, verificationCode, 'Reset Your Louisianaroma Password ⚜️');

    return {
      success: true,
      message: 'Verification code dispatched successfully.',
      data: {
        status: true,
        message: 'Check your email inbox',
      },
    };
  }

  async verification_forgot_user(dto: VerificationForgotUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationCode: dto.verificationCode,
        verificationCodeExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Verification code is invalid or has expired.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });

    // Return accessToken that is used to authorize password resets
    const payload = { id: user.id, role: user.role, email: user.email };
    const resetToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Successfully Verify User',
      data: resetToken,
    };
  }

  async reset_password(dto: ResetPasswordDto, authUserId?: string) {
    const targetUserId = dto.userId || authUserId;

    if (!targetUserId) {
      throw new BadRequestException('User identification is missing for password reset.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('Target user profile not found.');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Successfully Reset User Password',
    };
  }
}
