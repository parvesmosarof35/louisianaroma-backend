import { z } from 'zod';

export const CreateInquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  inquiryType: z.enum(['general', 'order', 'commission', 'discovery']),
  message: z.string().min(5, 'Message must be at least 5 characters.'),
});

export class CreateInquiryDto {
  name!: string;
  email!: string;
  inquiryType!: 'general' | 'order' | 'commission' | 'discovery';
  message!: string;
}
