import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ShippoService {
  private readonly logger = new Logger(ShippoService.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SHIPPO_API_KEY') || 'shippo_test_12345';
  }

  private parseAddress(shippingAddress: string) {
    const parts = shippingAddress.split(',').map((p) => p.trim());
    const name = parts[0] || 'Valued Customer';
    const street1 = parts[1] || '';
    const city = parts[2] || '';

    let stateAndZip = parts[3] || '';
    let countryPart = parts[4] || '';

    let state = '';
    let zip = '';
    let phone = '';

    const phoneMatch = shippingAddress.match(/\(Phone:\s*([^\)]+)\)/i);
    if (phoneMatch) {
      phone = phoneMatch[1].trim();
    }

    stateAndZip = stateAndZip.replace(/\(Phone:\s*[^\)]+\)/i, '').trim();
    countryPart = countryPart.replace(/\(Phone:\s*[^\)]+\)/i, '').trim();

    if (stateAndZip) {
      const subParts = stateAndZip.split(/\s+/);
      if (subParts.length >= 2) {
        state = subParts[0];
        zip = subParts.slice(1).join(' ');
      } else {
        state = stateAndZip;
      }
    }

    let country = countryPart || 'US';
    if (country.toLowerCase() === 'usa' || country.toLowerCase() === 'united states') {
      country = 'US';
    }

    if (!state) state = 'LA';
    if (!zip) zip = '70112';
    if (!phone) phone = '+15555555555';

    return {
      name,
      street1,
      city,
      state,
      zip,
      country,
      phone,
    };
  }

  async createOrder(orderData: any, shippingAddress: string, customerEmail: string) {
    const addressTo = this.parseAddress(shippingAddress);

    const lineItems = orderData.items?.map((item: any) => {
      let title = 'Luxury Product';
      let sku = 'SKU-000';
      if (item.product) {
        title = item.product.name;
        sku = item.product.id;
      } else if (item.customBlend) {
        title = item.customBlend.name || 'Bespoke Custom Blend';
        sku = item.customBlend.id;
      }

      return {
        quantity: item.quantity || 1,
        sku,
        title,
        total_price: item.price ? item.price.toString() : '0.00',
        currency: 'USD',
        weight: '1.00', // Default weight
        weight_unit: 'lb',
      };
    }) || [];

    try {
      this.logger.log(`Creating Shippo Order for ${addressTo.name} in ${addressTo.country}`);

      const orderResponse = await fetch('https://api.goshippo.com/orders/', {
        method: 'POST',
        headers: {
          Authorization: `ShippoToken ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_address: {
            ...addressTo,
            email: customerEmail,
          },
          line_items: lineItems,
          placed_at: new Date().toISOString(),
          order_number: orderData.id,
          order_status: 'PAID',
          total_price: orderData.totalAmount?.toString() || '0.00',
          currency: 'USD',
        }),
      });

      if (!orderResponse.ok) {
        const errText = await orderResponse.text();
        throw new Error(`Shippo order creation failed: ${errText}`);
      }

      const shippoOrder = await orderResponse.json();

      return {
        shippoOrderId: shippoOrder.object_id,
        error: null,
      };
    } catch (error: any) {
      this.logger.error(`Shippo automated order creation failed: ${error.message}`);
      return {
        shippoOrderId: null,
        error: error.message || 'Unknown Shippo error',
      };
    }
  }
}
