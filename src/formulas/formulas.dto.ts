import { z } from 'zod';

export const CreateFormulaSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().min(1, 'Description is required.'),
  title: z.string().min(1, 'Title is required.'),
  image: z.string().optional().default(''),
});

export const UpdateFormulaSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  image: z.string().optional(),
});

export class CreateFormulaDto {
  name!: string;
  description!: string;
  title!: string;
  image?: string;
}

export class UpdateFormulaDto {
  name?: string;
  description?: string;
  title?: string;
  image?: string;
}
