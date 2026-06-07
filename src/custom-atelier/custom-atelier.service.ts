import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCustomBlendDto,
  AdminCreateIngredientDto,
  AdminUpdateIngredientDto,
  AdminSizePricingDto,
  AdminConcentrationLevelDto,
  AdminEssenceMediumDto,
  AdminCuratedProductDto,
} from './custom-atelier.dto';

@Injectable()
export class CustomAtelierService {
  constructor(private prisma: PrismaService) {}

  // ─── Customer Blending Flow Methods ──────────────────────────────

  async getIngredients() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { type: 'asc' },
    });
    return {
      success: true,
      meta: { count: ingredients.length },
      data: ingredients,
    };
  }

  async getMediums() {
    const mediums = await (this.prisma as any).essencemedium.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      success: true,
      meta: { count: mediums.length },
      data: mediums,
    };
  }

  async getPricingConfigurations() {
    const sizes = await this.prisma.sizePricing.findMany({
      where: { isAvailable: true },
      orderBy: { price: 'asc' },
    });
    const concentrations = await this.prisma.concentrationLevel.findMany({
      where: { isAvailable: true },
      orderBy: { additionalPrice: 'asc' },
    });

    return {
      success: true,
      data: {
        sizes,
        concentrations,
      },
    };
  }

  async getCuratedProducts() {
    const products = await this.prisma.curatedProduct.findMany({
      where: { isFeatured: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      meta: { count: products.length },
      data: products,
    };
  }

  async createBlend(userId: string | null, dto: CreateCustomBlendDto) {
    // 1. Verify ingredient IDs exist in either reserves (Ingredient) or display collections (Formula)
    const ingredientIds = dto.ingredients.map((ing) => ing.ingredientId);
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });
    const existingFormulas = await this.prisma.formula.findMany({
      where: { id: { in: ingredientIds } },
    });

    const totalFound = existingIngredients.length + existingFormulas.length;

    if (totalFound !== ingredientIds.length) {
      throw new BadRequestException('One or more selected raw materials are not available in our reserves.');
    }

    // 2. Fetch configurations to compute final price dynamically on backend (no price spoofing!)
    const sizeConfig = await this.prisma.sizePricing.findUnique({
      where: { size: dto.bottleSize },
    });
    const concConfig = await this.prisma.concentrationLevel.findUnique({
      where: { percentage: dto.concentration },
    });

    const finalPrice = (sizeConfig?.price || 70.00) + (concConfig?.additionalPrice || 0.00);

    // 3. Register custom blend and ingredients configurations inside a transaction
    const blend = await this.prisma.$transaction(async (tx) => {
      const newBlend = await tx.customBlend.create({
        data: {
          userId,
          name: dto.name,
          price: finalPrice,
          bottleSize: dto.bottleSize,
          concentration: dto.concentration,
          mediumId: dto.mediumId,
          labelBg: dto.labelBg,
          textColor: dto.textColor,
          textAlign: dto.textAlign,
          labelFontSize: dto.labelFontSize,
          productType: dto.productType,
        },
      });

      // Map Formula IDs to physical Ingredient IDs so the relation lookup succeeds
      const mappedIngredients = await Promise.all(
        dto.ingredients.map(async (ing) => {
          let ingredient = await tx.ingredient.findUnique({
            where: { id: ing.ingredientId },
          });

          if (!ingredient) {
            const formula = await tx.formula.findUnique({
              where: { id: ing.ingredientId },
            });
            if (formula) {
              const formulaNameLower = formula.name.toLowerCase();
              const allIngs = await tx.ingredient.findMany();
              ingredient = allIngs.find((i) => {
                const ingNameLower = i.name.toLowerCase();
                if (formulaNameLower.includes(ingNameLower) || ingNameLower.includes(formulaNameLower)) {
                  return true;
                }
                const keywords = ["bergamot", "pepper", "lemon", "rose", "iris", "jasmine", "oud", "vanilla", "ambergris", "amber", "sandalwood", "citrus"];
                for (const word of keywords) {
                  if (formulaNameLower.includes(word) && ingNameLower.includes(word)) {
                    return true;
                  }
                }
                return false;
              }) || null;
            }
          }

          // Fallback to first available ingredient if mapping failed completely
          if (!ingredient) {
            ingredient = await tx.ingredient.findFirst();
          }

          return {
            ingredientId: ingredient ? ingredient.id : ing.ingredientId,
            percentage: ing.percentage,
          };
        }),
      );

      await tx.blendIngredient.createMany({
        data: mappedIngredients.map((ing) => ({
          blendId: newBlend.id,
          ingredientId: ing.ingredientId,
          percentage: ing.percentage,
        })),
      });

      return newBlend;
    });

    // 4. Fetch complete blend details to return
    return this.findOneBlend(blend.id);
  }

  async findOneBlend(id: string) {
    const blend = await this.prisma.customBlend.findUnique({
      where: { id },
      include: {
        medium: true,
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

  // ─── Administrative CRUD Methods ───────────────────────────────────

  // 1. Ingredients CRUD
  async createIngredient(dto: AdminCreateIngredientDto) {
    const ingredient = await this.prisma.ingredient.create({
      data: dto,
    });
    return {
      success: true,
      data: ingredient,
    };
  }

  async updateIngredient(id: string, dto: AdminUpdateIngredientDto) {
    // Check existence
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Specified ingredient is not documented.');
    }

    const ingredient = await this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });
    return {
      success: true,
      data: ingredient,
    };
  }

  async deleteIngredient(id: string) {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Specified ingredient is not documented.');
    }

    // Check if linked to blends, if so, fail deletion or delete clean.
    // In MongoDb, we delete cascade or handle gracefully:
    await this.prisma.blendIngredient.deleteMany({ where: { ingredientId: id } });
    await this.prisma.ingredient.delete({ where: { id } });

    return {
      success: true,
      message: 'Ingredient successfully removed from archives.',
    };
  }

  // 2. Sizes & Base Pricing Configurations
  async upsertSizePricing(dto: AdminSizePricingDto) {
    const sizePricing = await this.prisma.sizePricing.upsert({
      where: { size: dto.size },
      update: {
        label: dto.label,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
      },
      create: {
        size: dto.size,
        label: dto.label,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return {
      success: true,
      data: sizePricing,
    };
  }

  // 3. Concentration Settings Markup additions
  async upsertConcentrationLevel(dto: AdminConcentrationLevelDto) {
    const concLevel = await this.prisma.concentrationLevel.upsert({
      where: { percentage: dto.percentage },
      update: {
        name: dto.name,
        additionalPrice: dto.additionalPrice,
        isAvailable: dto.isAvailable ?? true,
      },
      create: {
        percentage: dto.percentage,
        name: dto.name,
        additionalPrice: dto.additionalPrice,
        isAvailable: dto.isAvailable ?? true,
      },
    });

    return {
      success: true,
      data: concLevel,
    };
  }

  // 4. Essence Medium Configuration (Legacy / Unused)
  async upsertEssenceMedium(dto: AdminEssenceMediumDto) {
    return {
      success: true,
      message: 'Legacy essenceMedium configuration bypassed.',
    };
  }

  // 5. Curated Products CRUD
  async createCuratedProduct(dto: AdminCuratedProductDto) {
    const curated = await this.prisma.curatedProduct.create({
      data: {
        name: dto.name,
        category: dto.category,
        image: dto.image,
        description: dto.description,
        formulaIds: dto.formulaIds,
        percentages: dto.percentages,
        bottleSize: dto.bottleSize ?? '100ml',
        concentration: dto.concentration ?? '30%',
        labelBg: dto.labelBg ?? '#1A1C1C',
        textColor: dto.textColor ?? '#F2CA50',
        textAlign: dto.textAlign ?? 'center',
        labelFontSize: dto.labelFontSize ?? 1.0,
        isFeatured: dto.isFeatured ?? true,
      },
    });

    return {
      success: true,
      data: curated,
    };
  }

  async updateCuratedProduct(id: string, dto: AdminCuratedProductDto) {
    const existing = await this.prisma.curatedProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Specified portfolio design is not present in our curated catalogs.');
    }

    const curated = await this.prisma.curatedProduct.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        image: dto.image,
        description: dto.description,
        formulaIds: dto.formulaIds,
        percentages: dto.percentages,
        bottleSize: dto.bottleSize,
        concentration: dto.concentration,
        labelBg: dto.labelBg,
        textColor: dto.textColor,
        textAlign: dto.textAlign,
        labelFontSize: dto.labelFontSize,
        isFeatured: dto.isFeatured,
      },
    });

    return {
      success: true,
      data: curated,
    };
  }

  async deleteCuratedProduct(id: string) {
    const existing = await this.prisma.curatedProduct.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Specified portfolio design is not present in our curated catalogs.');
    }

    await this.prisma.curatedProduct.delete({ where: { id } });

    return {
      success: true,
      message: 'Portfolio showcase design successfully removed from client showcase.',
    };
  }
}
