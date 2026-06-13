import { z } from 'zod';

export const AboutUsSchema = z.object({
  aboutus: z.string().optional(),
  aboutusimage: z.string().optional(),
  adminmessage: z.string().optional(),
  adminimage: z.string().optional(),
});

export const PrivacyPolicySchema = z.object({
  PrivacyPolicy: z.string().min(10, 'Privacy policy details must be meaningful.'),
});

export const TermsConditionsSchema = z.object({
  TermsConditions: z.string().min(10, 'Terms and conditions details must be meaningful.'),
});

export class AboutUsDto {
  aboutus?: string;
  aboutusimage?: string;
  adminmessage?: string;
  adminimage?: string;
}

export class PrivacyPolicyDto {
  PrivacyPolicy!: string;
}

export class TermsConditionsDto {
  TermsConditions!: string;
}

export const SiteConfigFieldSchema = z.object({
  url: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const BrandingSocialsSchema = z.object({
  navbarLogo: z.string().optional().nullable(),
  footerLogo: z.string().optional().nullable(),
  facebook: SiteConfigFieldSchema.optional().nullable(),
  instagram: SiteConfigFieldSchema.optional().nullable(),
  twitter: SiteConfigFieldSchema.optional().nullable(),
  linkedin: SiteConfigFieldSchema.optional().nullable(),
  youtube: SiteConfigFieldSchema.optional().nullable(),
  tiktok: SiteConfigFieldSchema.optional().nullable(),
  whatsapp: SiteConfigFieldSchema.optional().nullable(),
  telegram: SiteConfigFieldSchema.optional().nullable(),
  snapchat: SiteConfigFieldSchema.optional().nullable(),
  address: SiteConfigFieldSchema.optional().nullable(),
  phone: SiteConfigFieldSchema.optional().nullable(),
  email: SiteConfigFieldSchema.optional().nullable(),
  website: SiteConfigFieldSchema.optional().nullable(),
  appName: SiteConfigFieldSchema.optional().nullable(),
});

export class SiteConfigFieldDto {
  url?: string | null;
  isActive?: boolean;
}

export class BrandingSocialsDto {
  navbarLogo?: string | null;
  footerLogo?: string | null;
  facebook?: SiteConfigFieldDto | null;
  instagram?: SiteConfigFieldDto | null;
  twitter?: SiteConfigFieldDto | null;
  linkedin?: SiteConfigFieldDto | null;
  youtube?: SiteConfigFieldDto | null;
  tiktok?: SiteConfigFieldDto | null;
  whatsapp?: SiteConfigFieldDto | null;
  telegram?: SiteConfigFieldDto | null;
  snapchat?: SiteConfigFieldDto | null;
  address?: SiteConfigFieldDto | null;
  phone?: SiteConfigFieldDto | null;
  email?: SiteConfigFieldDto | null;
  website?: SiteConfigFieldDto | null;
  appName?: SiteConfigFieldDto | null;
}

export const ShutdownSchema = z.object({
  isShutdown: z.boolean(),
  shutdownMessage: z.string().optional().nullable(),
});

export class ShutdownDto {
  isShutdown!: boolean;
  shutdownMessage?: string | null;
}

export const DeliveryPriceSchema = z.object({
  insideusa: z.number().min(0, 'Inside USA delivery charge must be non-negative.'),
  outsideusa: z.number().min(0, 'Outside USA delivery charge must be non-negative.'),
});

export class DeliveryPriceDto {
  insideusa!: number;
  outsideusa!: number;
}

export const CreateFragranceStatusSchema = z.object({
  isCreateFragranceDisabled: z.boolean(),
  createFragranceMessage: z.string().optional().nullable(),
});

export class CreateFragranceStatusDto {
  isCreateFragranceDisabled!: boolean;
  createFragranceMessage?: string | null;
}


