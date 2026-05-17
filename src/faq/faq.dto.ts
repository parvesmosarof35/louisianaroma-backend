import { z } from 'zod';

export const CreateFaqSchema = z.object({
  question: z.string().min(5, 'Question must have at least 5 characters.'),
  answer: z.string().min(5, 'Answer must have at least 5 characters.'),
  question_type: z.string().default('general'),
});

export const UpdateFaqSchema = z.object({
  question: z.string().min(5).optional(),
  answer: z.string().min(5).optional(),
  question_type: z.string().optional(),
});

export class CreateFaqDto {
  question!: string;
  answer!: string;
  question_type!: string;
}

export class UpdateFaqDto {
  question?: string;
  answer?: string;
  question_type?: string;
}
