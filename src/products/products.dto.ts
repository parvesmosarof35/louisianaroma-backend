import { z } from 'zod';

export const ProductImageSchema = z.object({
  image: z.string().url('Product image must be a valid URL.'),
  position: z.number().int().min(0),
});

export const ProductFaqSchema = z.object({
  question: z.string().min(5, 'Question must have at least 5 characters.'),
  answer: z.string().min(5, 'Answer must have at least 5 characters.'),
  isvisible: z.boolean().default(true),
});

export const SectionTwoCardSchema = z.object({
  image: z.string().url('Card image must be a valid URL.').or(z.literal('')),
  slogan: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(5),
});

export const SectionTwoSchema = z.object({
  show: z.boolean().default(true),
  title: z.string().min(2),
  description: z.string().min(5),
  cards: z.array(SectionTwoCardSchema).default([]),
});

export const SizePriceSchema = z.object({
  size: z.string().min(1, 'Size must not be empty.'),
  price: z.number().positive('Price must be greater than zero.'),
});

export const CreateProductSchema = z.object({
  label: z.string().min(2, 'Label must have at least 2 characters.'),
  name: z.string().min(2, 'Name must have at least 2 characters.'),
  category: z.string().min(1, 'Category (Collection ID) is required.'),
  price: z.number().positive('Price must be greater than zero.'),
  description: z.string().optional(),
  images: z.array(ProductImageSchema).default([]),
  sizes: z.array(z.string()).default([]),
  sizePrices: z.array(SizePriceSchema).default([]),
  tags: z.array(z.string()).default([]),
  faqs: z.array(ProductFaqSchema).default([]),
  sectiontwo: SectionTwoSchema.nullable().optional(),
  isAvailable: z.boolean().default(true),
  stock: z.number().int().min(0).optional(),
  hasfreedelivery: z.boolean().default(false),
  isfeatured: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export class CreateProductDto {
  label!: string;
  name!: string;
  category!: string;
  price!: number;
  description?: string;
  images?: { image: string; position: number }[];
  sizes?: string[];
  sizePrices?: { size: string; price: number }[];
  tags?: string[];
  faqs?: { question: string; answer: string; isvisible?: boolean }[];
  sectiontwo?: {
    show: boolean;
    title: string;
    description: string;
    cards: { image: string; slogan: string; title: string; description: string }[];
  } | null;
  isAvailable?: boolean;
  stock?: number;
  hasfreedelivery?: boolean;
  isfeatured?: boolean;
}

export class UpdateProductDto {
  label?: string;
  name?: string;
  category?: string;
  price?: number;
  description?: string;
  images?: { image: string; position: number }[];
  sizes?: string[];
  sizePrices?: { size: string; price: number }[];
  tags?: string[];
  faqs?: { question: string; answer: string; isvisible?: boolean }[];
  sectiontwo?: {
    show: boolean;
    title: string;
    description: string;
    cards: { image: string; slogan: string; title: string; description: string }[];
  } | null;
  isAvailable?: boolean;
  stock?: number;
  hasfreedelivery?: boolean;
  isfeatured?: boolean;
}
