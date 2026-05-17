import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomBlendDto } from './custom-blends.dto';

@Injectable()
export class CustomBlendsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string | null, dto: CreateCustomBlendDto) {
    // 1. Verify all ingredient IDs exist in the database
    const ingredientIds = dto.ingredients.map((ing) => ing.ingredientId);
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    if (existingIngredients.length !== ingredientIds.length) {
      throw new BadRequestException('One or more selected raw materials are not available in our reserves.');
    }

    // 2. Create the custom blend and its ingredient configurations inside a transaction
    const blend = await this.prisma.$transaction(async (tx) => {
      const newBlend = await tx.customBlend.create({
        data: {
          userId,
          name: dto.name,
          price: 450.0, // Fixed price for bespoke formulas
          labelBg: dto.labelBg,
          textColor: dto.textColor,
          textAlign: dto.textAlign,
          labelFontSize: dto.labelFontSize,
          productType: dto.productType,
        },
      });

      // Create ingredients link
      await tx.blendIngredient.createMany({
        data: dto.ingredients.map((ing) => ({
          blendId: newBlend.id,
          ingredientId: ing.ingredientId,
          percentage: ing.percentage,
        })),
      });

      return newBlend;
    });

    // Fetch complete blend details to return
    return this.findOne(blend.id);
  }

  async findOne(id: string) {
    const blend = await this.prisma.customBlend.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!blend) {
      throw new NotFoundException('The custom scent formulation you seek is not present in our atelier journals.');
    }

    return {
      success: true,
      data: blend,
    };
  }

  async findUserBlends(userId: string) {
    const blends = await this.prisma.customBlend.findMany({
      where: { userId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      meta: { count: blends.length },
      data: blends,
    };
  }
}
