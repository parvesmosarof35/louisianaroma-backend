import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { type: 'asc' },
    });

    return {
      success: true,
      meta: { count: ingredients.length },
      data: ingredients,
    };
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('The precious raw ingredient requested is not available in our current reserves.');
    }

    return {
      success: true,
      data: ingredient,
    };
  }
}
