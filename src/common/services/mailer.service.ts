import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const email = this.configService.get<string>('NODEMAILER_EMAIL') || '';
    const password = this.configService.get<string>('NODEMAILER_PASSWORD') || '';

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: email,
        pass: password,
      },
    });
  }

  async sendVerificationCode(to: string, code: number, subject = 'Verify Your Louisianaroma Account ⚜️') {
    const htmlContent = `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0b0c10; color: #f5f5f7; border: 1px solid #1f2833; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c5a880; font-size: 28px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Louisianaroma</h1>
          <p style="color: #66fcf1; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Atelier of Bespoke Fragrance</p>
        </div>
        <div style="padding: 20px; border-top: 1px solid #1f2833; border-bottom: 1px solid #1f2833; text-align: center; margin-bottom: 30px;">
          <h2 style="color: #f5f5f7; font-size: 20px; font-weight: 300; margin-bottom: 20px;">Your Olfactory Credentials Code</h2>
          <div style="background-color: #1f2833; color: #c5a880; font-size: 36px; font-weight: bold; padding: 15px 30px; letter-spacing: 8px; display: inline-block; border-radius: 4px; margin-bottom: 20px; border: 1px solid #c5a880;">
            ${code}
          </div>
          <p style="color: #8f94fb; font-size: 13px; line-height: 1.6; margin: 0 10px;">
            Please present this 6-digit signature code to verify your noble credentials. This code is valid for exactly 30 minutes.
          </p>
        </div>
        <div style="text-align: center; color: #45f3ff; font-size: 11px; letter-spacing: 1px;">
          If you did not initiate this olfactory registration request, please disregard this transmission securely.<br>
          &copy; 2026 Louisianaroma. All rights reserved.
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"Louisianaroma Atelier" <${this.configService.get<string>('NODEMAILER_EMAIL') || 'parvesmosarof2@gmail.com'}>`,
        to,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (error: any) {
      console.error('SMTP Mail Transmission Error:', error);
      throw new InternalServerErrorException('Failed to dispatch verification code email from the private mailer.');
    }
  }
}
