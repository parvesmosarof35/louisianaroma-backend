import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address of appropriate olfactory refinement.'),
  password: z.string().min(6, 'Your password must be at least 6 characters in length to safeguard your account.'),
  name: z.string().min(2, 'Please provide your full noble name.').optional(),
  image: z.string().url().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

export class RegisterDto {
  email!: string;
  password!: string;
  name?: string;
  image?: string;
}

export class LoginDto {
  email!: string;
  password!: string;
}
