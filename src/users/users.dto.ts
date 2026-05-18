import { z } from 'zod';

export const CreateUserSchema = z.object({
  fullname: z.string().min(2, 'Noble name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address of appropriate olfactory refinement.'),
  phoneNumber: z.string().min(6, 'Please provide a valid phone number.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const UserVerificationSchema = z.object({
  verificationCode: z.coerce.number().int().positive('Invalid verification code.'),
});

export const ChangePasswordSchema = z.object({
  newpassword: z.string().min(6, 'New password must be at least 6 characters.'),
  oldpassword: z.string().min(1, 'Old password is required.'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export const VerificationForgotUserSchema = z.object({
  verificationCode: z.coerce.number().int().positive('Invalid verification code.'),
});

export const ResetPasswordSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID ObjectId.').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export class CreateUserDto {
  fullname!: string;
  email!: string;
  phoneNumber!: string;
  password!: string;
}

export class UserVerificationDto {
  verificationCode!: number;
}

export class ChangePasswordDto {
  newpassword!: string;
  oldpassword!: string;
}

export class ForgotPasswordDto {
  email!: string;
}

export class VerificationForgotUserDto {
  verificationCode!: number;
}

export class ResetPasswordDto {
  userId?: string;
  password!: string;
}
