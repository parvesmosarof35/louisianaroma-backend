import { z } from 'zod';

export const CreatePreviousCustomizedProductSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  title: z.string().min(1, 'Title is required.'),
  image: z.string().optional().default(''),
});

export const UpdatePreviousCustomizedProductSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  image: z.string().optional(),
});

export class CreatePreviousCustomizedProductDto {
  name!: string;
  title!: string;
  image?: string;
}

export class UpdatePreviousCustomizedProductDto {
  name?: string;
  title?: string;
  image?: string;
}
