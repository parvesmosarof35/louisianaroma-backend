import { z } from 'zod';

export const CustomBlendIngredientSchema = z.object({
  ingredientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Precious ingredient reference must be a valid 24-character hex ObjectId signature.'),
  percentage: z.number().int().min(1, 'Ingredient percentage must be at least 1%.').max(100, 'Ingredient percentage cannot exceed 100%.'),
});

export const CreateCustomBlendSchema = z.object({
  name: z.string().min(2, 'Fragrance name must have at least 2 characters of nobility.').max(50, 'Fragrance name must be elegant and concise.'),
  labelBg: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Label background must be a valid hex color code.'),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Text color must be a valid hex color code.'),
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  labelFontSize: z.number().min(0.5).max(3.0).default(1.0),
  productType: z.string().default('Fragrance'),
  ingredients: z.array(CustomBlendIngredientSchema)
    .min(1, 'A custom blend requires at least one exquisite ingredient.')
    .max(3, 'A premium formulation is capped at three primary ingredients to maintain olfactory harmony.'),
}).refine((data) => {
  const total = data.ingredients.reduce((sum, item) => sum + item.percentage, 0);
  return total === 100;
}, {
  message: 'The collective concentration of the selected ingredients must equal precisely 100%.',
  path: ['ingredients'],
});

export class CustomBlendIngredientDto {
  ingredientId!: string;
  percentage!: number;
}

export class CreateCustomBlendDto {
  name!: string;
  labelBg!: string;
  textColor!: string;
  textAlign!: 'left' | 'center' | 'right';
  labelFontSize!: number;
  productType!: string;
  ingredients!: CustomBlendIngredientDto[];
}
