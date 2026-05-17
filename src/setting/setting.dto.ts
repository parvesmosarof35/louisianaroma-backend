import { z } from 'zod';

export const AboutUsSchema = z.object({
  aboutUs: z.string().min(10, 'About us details must be a meaningful description.'),
});

export const PrivacyPolicySchema = z.object({
  PrivacyPolicy: z.string().min(10, 'Privacy policy details must be meaningful.'),
});

export const TermsConditionsSchema = z.object({
  TermsConditions: z.string().min(10, 'Terms and conditions details must be meaningful.'),
});

export class AboutUsDto {
  aboutUs!: string;
}

export class PrivacyPolicyDto {
  PrivacyPolicy!: string;
}

export class TermsConditionsDto {
  TermsConditions!: string;
}
