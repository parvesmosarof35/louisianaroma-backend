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

  async sendOrderNotificationEmail(to: string, order: any, type: 'PURCHASE' | 'DELIVERED' | 'CANCELLED') {
    let subject = 'Your Louisianaroma Purchase Confirmation ⚜️';
    let statusTitle = 'Order Confirmed';
    let statusDescription = 'Thank you for your purchase. Our atelier is preparing your olfactory creation.';
    let statusColor = '#66fcf1';

    if (type === 'DELIVERED') {
      subject = 'Your Louisianaroma Fragrance has Shipped 📦';
      statusTitle = 'Shipment Dispatched';
      statusDescription = 'Your custom formulation has been certified and dispatched from our atelier.';
      statusColor = '#45f3ff';
    } else if (type === 'CANCELLED') {
      subject = 'Your Louisianaroma Order has been Cancelled ❌';
      statusTitle = 'Order Cancelled';
      statusDescription = 'This order has been cancelled and reserves have been securely restored.';
      statusColor = '#ff4d4d';
    }

    const itemsHtml = (order.items || []).map((item: any) => {
      const name = item.product?.name || item.customBlend?.name || 'Bespoke Custom Blend';
      const qty = item.quantity || 1;
      const itemPrice = item.price || 0;
      const typeLabel = item.product ? 'Standard Formulation' : 'Bespoke Olfactory Signature';
      return `
        <div style="padding: 15px 0; border-bottom: 1px solid #1f2833; font-family: 'Outfit', sans-serif;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="text-align: left; vertical-align: top;">
                <h4 style="color: #f5f5f7; margin: 0 0 5px 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">${name}</h4>
                <span style="color: #c5a880; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${typeLabel}</span>
              </td>
              <td style="text-align: right; vertical-align: middle; width: 120px;">
                <span style="color: #8f94fb; font-size: 13px; font-weight: 500; margin-right: 15px;">QTY: ${qty}</span>
                <span style="color: #66fcf1; font-size: 14px; font-weight: bold;">$${(itemPrice * qty).toFixed(2)}</span>
              </td>
            </tr>
          </table>
        </div>
      `;
    }).join('');

    let trackingHtml = '';
    if (type === 'DELIVERED' && order.trackingNumber) {
      trackingHtml = `
        <div style="background-color: #1f2833; border: 1px solid #c5a880; border-radius: 6px; padding: 20px; text-align: center; margin: 30px 0;">
          <h3 style="color: #c5a880; font-size: 14px; letter-spacing: 2px; margin-top: 0; text-transform: uppercase;">Shipment Details</h3>
          <p style="color: #f5f5f7; font-size: 12px; font-weight: 300; line-height: 1.5; margin: 8px 0 20px 0;">
            Your custom-crafted luxury fragrance signature has departed our atelier and is in transit.
          </p>
          <div style="margin-bottom: 15px;">
            <span style="color: #8f94fb; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 5px;">Carrier Tracking Number</span>
            <strong style="color: #f5f5f7; font-size: 18px; letter-spacing: 1px;">${order.trackingNumber}</strong>
          </div>
          ${order.trackingUrl ? `
            <a href="${order.trackingUrl}" target="_blank" style="background-color: #c5a880; color: #0b0c10; text-decoration: none; font-size: 10px; font-weight: bold; letter-spacing: 2px; padding: 12px 25px; border-radius: 4px; display: inline-block; text-transform: uppercase;">
              Track Shipment
            </a>
          ` : ''}
        </div>
      `;
    }

    const htmlContent = `
      <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0b0c10; color: #f5f5f7; border: 1px solid #1f2833; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #c5a880; font-size: 28px; letter-spacing: 2px; margin: 0; text-transform: uppercase;">Louisianaroma</h1>
          <p style="color: #66fcf1; font-size: 12px; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">Atelier of Bespoke Fragrance</p>
        </div>
        
        <div style="padding: 20px 0; border-top: 1px solid #1f2833; border-bottom: 1px solid #1f2833; margin-bottom: 30px;">
          <h2 style="color: ${statusColor}; font-size: 20px; font-weight: 400; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">${statusTitle}</h2>
          <p style="color: #a9b7c6; font-size: 13px; line-height: 1.6; margin: 0;">${statusDescription}</p>
          
          <div style="margin-top: 15px; font-size: 12px; color: #8f94fb; text-transform: uppercase; letter-spacing: 1px;">
            Order Reference: <strong style="color: #f5f5f7;">${order.id}</strong>
          </div>
        </div>

        ${trackingHtml}

        <div style="margin-bottom: 35px;">
          <h3 style="color: #c5a880; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #1f2833; padding-bottom: 5px;">Your Selection</h3>
          ${itemsHtml}
        </div>

        <div style="background-color: #121414; padding: 20px; border-radius: 6px; border: 1px solid #1f2833; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse; font-family: 'Outfit', sans-serif; font-size: 13px;">
            <tr style="color: #a9b7c6;">
              <td style="padding: 5px 0; text-align: left;">Delivery Charge</td>
              <td style="padding: 5px 0; text-align: right; color: #f5f5f7;">
                ${order.deliveryCharge > 0 ? `$${order.deliveryCharge.toFixed(2)}` : 'Complimentary'}
              </td>
            </tr>
            <tr style="border-top: 1px solid #1f2833; color: #f5f5f7; font-weight: bold; font-size: 16px;">
              <td style="padding: 15px 0 0 0; text-align: left;">Total Portfolio Amount</td>
              <td style="padding: 15px 0 0 0; text-align: right; color: #c5a880;">$${(order.totalAmount || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 30px; border-top: 1px solid #1f2833; padding-top: 20px; font-size: 12px; line-height: 1.6; color: #a9b7c6;">
          <strong style="color: #c5a880; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px;">Shipping Destination</strong>
          ${order.shippingAddress}
        </div>

        <div style="text-align: center; color: #45f3ff; font-size: 11px; letter-spacing: 1px;">
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
      console.error('SMTP Order Mail Transmission Error:', error);
      // Suppress throwing error to avoid crashing core payment webhooks
      return false;
    }
  }
}
