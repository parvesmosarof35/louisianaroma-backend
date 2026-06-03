import { z } from 'zod';
import { CreateCustomBlendSchema, CreateCustomBlendDto } from '../custom-atelier/custom-atelier.dto';

export const OrderItemInputSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Product reference must be a valid 24-character hex ObjectId signature.').optional(),
  customBlendId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Custom blend reference must be a valid 24-character hex ObjectId signature.').optional(),
  newCustomBlend: CreateCustomBlendSchema.optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
}).refine((data) => {
  const count = [data.productId, data.customBlendId, data.newCustomBlend].filter(Boolean).length;
  return count === 1;
}, {
  message: 'An item must be exactly a standard product, an existing custom blend, or a new bespoke formulation.',
});

export const CreateOrderSchema = z.object({
  shippingAddress: z.string().min(10, 'Please provide a comprehensive shipping address for secure fragrance delivery.'),
  paymentId: z.string().min(1, 'Payment reference required to confirm the checkout transactions.').optional(),
  items: z.array(OrderItemInputSchema).min(1, 'Your selection must contain at least one fine product to initiate checkout.'),
});

export class OrderItemInputDto {
  productId?: string;
  customBlendId?: string;
  newCustomBlend?: CreateCustomBlendDto;
  quantity!: number;
}

export class CreateOrderDto {
  shippingAddress!: string;
  paymentId?: string;
  items!: OrderItemInputDto[];
}

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    message: 'Invalid order status value.',
  }),
});

export class UpdateOrderStatusDto {
  status!: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

