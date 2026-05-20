import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './inquiries.dto';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInquiryDto) {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        inquiryType: dto.inquiryType,
        message: dto.message,
        isRead: false,
      },
    });

    return {
      success: true,
      message: 'Inquiry submitted successfully',
      data: inquiry,
    };
  }

  async findAll(
    searchTerm?: string,
    inquiryType?: string,
    isRead?: string,
    page = 1,
    limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition: any = {};

    if (inquiryType) {
      whereCondition.inquiryType = inquiryType;
    }

    if (isRead !== undefined && isRead !== '') {
      whereCondition.isRead = isRead === 'true';
    }

    if (searchTerm) {
      whereCondition.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { message: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.inquiry.count({ where: whereCondition });
    const inquiries = await this.prisma.inquiry.findMany({
      where: whereCondition,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: {
        page,
        limit,
        total,
      },
      data: inquiries,
    };
  }

  async markAsRead(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new NotFoundException(`The inquiry with ID '${id}' was not found.`);
    }

    const updated = await this.prisma.inquiry.update({
      where: { id },
      data: { isRead: true },
    });

    return {
      success: true,
      message: 'Inquiry marked as read successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new NotFoundException(`The inquiry with ID '${id}' was not found.`);
    }

    await this.prisma.inquiry.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Inquiry deleted successfully',
    };
  }
}
