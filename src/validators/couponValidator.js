import z from 'zod';
import { DISCOUNT_TYPE } from '../utils/index.js';

export const couponSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  discountType: z.enum(Object.values(DISCOUNT_TYPE)),
  discountValue: z.number().min(0, 'Discount value must be at least 0'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  usageLimit: z.number().min(1, 'Usage limit must be at least 1'),
  minimumPurchase: z.number().min(0).optional()
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Code is required')
});
