import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormulaDto, UpdateFormulaDto } from './formulas.dto';

@Injectable()
export class FormulasService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFormulaDto) {
    const formula = await this.prisma.formula.create({
      data: {
        name: dto.name,
        description: dto.description,
        title: dto.title,
        image: dto.image || '',
      },
    });

    return {
      success: true,
      message: 'Formula created successfully',
      data: formula,
    };
  }

  async findAll(searchTerm?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const whereCondition: any = {};
    if (searchTerm) {
      whereCondition.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.formula.count({ where: whereCondition });
    const formulas = await this.prisma.formula.findMany({
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
      data: formulas,
    };
  }

  async findOne(id: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${id}' was not found.`);
    }

    return {
      success: true,
      data: formula,
    };
  }

  async update(id: string, dto: UpdateFormulaDto) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${id}' was not found.`);
    }

    const updated = await this.prisma.formula.update({
      where: { id },
      data: {
        name: dto.name ?? formula.name,
        description: dto.description ?? formula.description,
        title: dto.title ?? formula.title,
        image: dto.image ?? formula.image,
      },
    });

    return {
      success: true,
      message: 'Formula updated successfully',
      data: updated,
    };
  }

  async remove(id: string) {
    const formula = await this.prisma.formula.findUnique({
      where: { id },
    });

    if (!formula) {
      throw new NotFoundException(`Formula with ID '${id}' was not found.`);
    }

    await this.prisma.formula.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Formula deleted successfully',
    };
  }
}
