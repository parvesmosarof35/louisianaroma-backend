import { z } from 'zod';

export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
  orderId: z.string().min(1, 'Order ID is required.'),
  rating: z.preprocess((val) => Number(val), z.number().int().min(1).max(5, 'Rating must be between 1 and 5.')),
  title: z.string().optional(),
  comment: z.string().min(5, 'Comment must have at least 5 characters.'),
  pictures: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return [val]; }
    }
    return val;
  }, z.array(z.string())).default([]),
});

export class CreateReviewDto {
  productId!: string;
  orderId!: string;
  rating!: number;
  title?: string;
  comment!: string;
  pictures?: string[];
}

export const UpdateReviewSchema = z.object({
  rating: z.preprocess((val) => Number(val), z.number().int().min(1).max(5, 'Rating must be between 1 and 5.')).optional(),
  title: z.string().optional(),
  comment: z.string().min(5, 'Comment must have at least 5 characters.').optional(),
  pictures: z.preprocess((val) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return [val]; }
    }
    return val;
  }, z.array(z.string())).optional(),
});

export class UpdateReviewDto {
  rating?: number;
  title?: string;
  comment?: string;
  pictures?: string[];
}
