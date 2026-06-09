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

  async createShipmentAndLabel(shippingAddress: string, customerEmail: string) {
    const addressTo = this.parseAddress(shippingAddress);

    const addressFrom = {
      name: 'Louisianaroma',
      street1: '123 Fragrance Way',
      city: 'New Orleans',
      state: 'LA',
      zip: '70112',
      country: 'US',
      phone: '+15553332222',
      email: 'atelier@louisianaroma.com',
    };

    const parcel = {
      length: '5',
      width: '5',
      height: '5',
      distance_unit: 'in',
      weight: '1',
      mass_unit: 'lb',
    };

    try {
      this.logger.log(`Creating Shippo shipment for ${addressTo.name} in ${addressTo.country}`);

      const shipmentResponse = await fetch('https://api.goshippo.com/shipments/', {
        method: 'POST',
        headers: {
          Authorization: `ShippoToken ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address_from: addressFrom,
          address_to: {
            ...addressTo,
            email: customerEmail,
          },
          parcels: [parcel],
          async: false,
        }),
      });

      if (!shipmentResponse.ok) {
        const errText = await shipmentResponse.text();
        throw new Error(`Shippo shipment creation failed: ${errText}`);
      }

      const shipment = await shipmentResponse.json();
      const rates = shipment.rates || [];

      if (rates.length === 0) {
        throw new Error('No shipping rates returned from Shippo.');
      }

      const sortedRates = [...rates].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      const cheapestRate = sortedRates[0];

      this.logger.log(`Purchasing Shippo label for rate: ${cheapestRate.object_id} ($${cheapestRate.amount} via ${cheapestRate.provider})`);

      const transactionResponse = await fetch('https://api.goshippo.com/transactions/', {
        method: 'POST',
        headers: {
          Authorization: `ShippoToken ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rate: cheapestRate.object_id,
          async: false,
        }),
      });

      if (!transactionResponse.ok) {
        const errText = await transactionResponse.text();
        throw new Error(`Shippo label purchase failed: ${errText}`);
      }

      const transaction = await transactionResponse.json();

      if (transaction.status === 'ERROR') {
        const errorMsg = transaction.messages?.[0]?.text || 'Unknown error';
        throw new Error(`Shippo transaction error: ${errorMsg}`);
      }

      return {
        shippoShipmentId: shipment.object_id,
        shippoTransactionId: transaction.object_id,
        trackingNumber: transaction.tracking_number,
        trackingUrl: transaction.tracking_url_provider,
        shippingLabelUrl: transaction.label_url,
        error: null,
      };
    } catch (error: any) {
      this.logger.error(`Shippo automated shipping failed: ${error.message}`);
      return {
        shippoShipmentId: null,
        shippoTransactionId: null,
        trackingNumber: null,
        trackingUrl: null,
        shippingLabelUrl: null,
        error: error.message || 'Unknown Shippo error',
      };
    }
  }
}
