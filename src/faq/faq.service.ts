import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto, UpdateFaqDto } from './faq.dto';

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFaqDto) {
    const faq = await this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        questionType: dto.question_type || 'general',
      },
    });

    return {
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    };
  }

  async findAll(searchTerm?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition: any = {};
    if (searchTerm) {
      whereCondition.OR = [
        { question: { contains: searchTerm, mode: 'insensitive' } },
        { answer: { contains: searchTerm, mode: 'insensitive' } },
        { questionType: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.faq.count({ where: whereCondition });
    const faqs = await this.prisma.faq.findMany({
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
      data: faqs,
    };
  }

  async findOne(id: string) {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`The FAQ formulation signature with ID '${id}' was not found.`);
    }

    return {
      success: true,
      data: faq,
    };
  }

  async update(id: string, dto: UpdateFaqDto) {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`The FAQ signature with ID '${id}' was not found.`);
    }

    const updated = await this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question || faq.question,
        answer: dto.answer || faq.answer,
        questionType: dto.question_type || faq.questionType,
      },
    });

    return {
      success: true,
      message: 'FAQ updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const faq = await this.prisma.faq.findUnique({
      where: { id },
    });

    if (!faq) {
      throw new NotFoundException(`The FAQ signature with ID '${id}' was not found.`);
    }

    await this.prisma.faq.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'FAQ deleted successfully',
    };
  }
}
