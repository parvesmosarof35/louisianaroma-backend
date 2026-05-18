import { z } from 'zod';

export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required.'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5.'),
  comment: z.string().min(5, 'Comment must have at least 5 characters.'),
  pictures: z.array(z.string().url('Picture must be a valid URL.')).default([]),
});

export class CreateReviewDto {
  productId!: string;
  rating!: number;
  comment!: string;
  pictures?: string[];
}
