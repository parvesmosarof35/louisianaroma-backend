import { z } from 'zod';
import { NoteType } from '@prisma/client';

// Helper for ObjectId validation
const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Precious signature reference must be a valid 24-character hex ObjectId.');

// ─── Customer-Facing Blending Schemes ──────────────────────────────
export const AtelierIngredientSchema = z.object({
  ingredientId: ObjectIdSchema,
  percentage: z.number().int().min(1, 'Concentration ratio must be at least 1%.').max(100, 'Concentration ratio cannot exceed 100%.'),
});

export const CreateCustomBlendSchema = z.object({
  name: z.string().min(2, 'Fragrance name must have at least 2 characters of nobility.').max(50, 'Fragrance name must be elegant and concise.'),
  bottleSize: z.string().min(1, 'Bottle size selection is required.'),
  concentration: z.string().min(1, 'Concentration level selection is required.'),
  mediumId: ObjectIdSchema,
  labelBg: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Label background must be a valid hex color code.'),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Text color must be a valid hex color code.'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  labelFontSize: z.number().min(0.5).max(3.0).default(1.0),
  productType: z.string().default('Fragrance'),
  ingredients: z.array(AtelierIngredientSchema)
    .min(1, 'A custom blend requires at least one exquisite ingredient.')
    .max(3, 'A premium formulation is capped at three primary ingredients to maintain olfactory harmony.'),
}).refine((data) => {
  const total = data.ingredients.reduce((sum, item) => sum + item.percentage, 0);
  return total === 100;
}, {
  message: 'The collective concentration of the selected ingredients must equal precisely 100%.',
  path: ['ingredients'],
});

export class AtelierIngredientDto {
  ingredientId!: string;
  percentage!: number;
}

export class CreateCustomBlendDto {
  name!: string;
  bottleSize!: string;
  concentration!: string;
  mediumId!: string;
  labelBg!: string;
  textColor!: string;
  textAlign!: 'left' | 'center' | 'right';
  labelFontSize!: number;
  productType!: string;
  ingredients!: AtelierIngredientDto[];
}

// ─── Admin Interface Schemes ───────────────────────────────────────

export const AdminCreateIngredientSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  category: z.string().min(1, 'Category is required.'),
  type: z.nativeEnum(NoteType, { message: 'Olfactory type must be TOP_NOTE, HEART_NOTE, or BASE_NOTE.' }),
  description: z.string().min(1, 'Description is required.'),
  image: z.string().min(1, 'Visual asset path is required.'),
  stock: z.number().int().nonnegative('Stock reserves cannot be negative.').default(1000),
});

export const AdminUpdateIngredientSchema = AdminCreateIngredientSchema.partial();

export class AdminCreateIngredientDto {
  name!: string;
  category!: string;
  type!: NoteType;
  description!: string;
  image!: string;
  stock?: number;
}

export class AdminUpdateIngredientDto {
  name?: string;
  category?: string;
  type?: NoteType;
  description?: string;
  image?: string;
  stock?: number;
}

export const AdminSizePricingSchema = z.object({
  size: z.string().min(1, 'Size code (e.g. 50ml) is required.'),
  label: z.string().min(1, 'Display label (e.g. 50mL) is required.'),
  price: z.number().positive('Base price must be a positive amount.'),
  isAvailable: z.boolean().default(true),
});

export class AdminSizePricingDto {
  size!: string;
  label!: string;
  price!: number;
  isAvailable?: boolean;
}

export const AdminConcentrationLevelSchema = z.object({
  percentage: z.string().min(1, 'Percentage code (e.g. 30%) is required.'),
  name: z.string().min(1, 'Concentration level name (e.g. Extrait) is required.'),
  additionalPrice: z.number().nonnegative('Markup price addition cannot be negative.'),
  isAvailable: z.boolean().default(true),
});

export class AdminConcentrationLevelDto {
  percentage!: string;
  name!: string;
  additionalPrice!: number;
  isAvailable?: boolean;
}

export const AdminEssenceMediumSchema = z.object({
  code: z.string().min(1, 'Unique single letter code is required.'),
  name: z.string().min(1, 'Medium name is required.'),
  description: z.string().min(1, 'Subtext description is required.'),
  icon: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export class AdminEssenceMediumDto {
  code!: string;
  name!: string;
  description!: string;
  icon?: string;
  isAvailable?: boolean;
}

export const AdminCuratedProductSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  category: z.string().min(1, 'Category is required.'),
  image: z.string().min(1, 'Image path is required.'),
  description: z.string().min(1, 'Description is required.'),
  formulaIds: z.array(ObjectIdSchema).min(1, 'Formulation requires at least one raw material.'),
  percentages: z.record(z.string(), z.number().min(1).max(100)).refine((percentages) => {
    const total = Object.values(percentages).reduce((sum, p) => sum + p, 0);
    return total === 100;
  }, {
    message: 'The collective sum of recipe percentages must equal precisely 100%.',
  }),
  bottleSize: z.string().default('100ml'),
  concentration: z.string().default('30%'),
  labelBg: z.string().default('#1A1C1C'),
  textColor: z.string().default('#F2CA50'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  labelFontSize: z.number().min(0.5).max(3.0).default(1.0),
  isFeatured: z.boolean().default(true),
});

export class AdminCuratedProductDto {
  name!: string;
  category!: string;
  image!: string;
  description!: string;
  formulaIds!: string[];
  percentages!: Record<string, number>;
  bottleSize?: string;
  concentration?: string;
  labelBg?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  labelFontSize?: number;
  isFeatured?: boolean;
}
