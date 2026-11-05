import z from 'zod';
import { DISCOUNT_TYPE } from '../utils/index.js';

const numberInput = schema =>
  z.preprocess(
    value =>
      typeof value === 'string'
        ? value.trim() === ''
          ? undefined
          : Number(value)
        : value,
    schema,
  );

const booleanInput = z.preprocess(value => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const couponSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
  discountType: z.enum(Object.values(DISCOUNT_TYPE)),
  discountValue: numberInput(
    z.number().min(0, 'Discount value must be at least 0'),
  ),
  maxDiscountAmount: numberInput(
    z
      .number()
      .min(0, 'Maximum discount amount cannot be negative')
      .nullable()
      .optional(),
  ),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  usageLimit: numberInput(
    z.number().min(1, 'Usage limit must be at least 1').nullable().optional(),
  ),
  minimumPurchase: numberInput(z.number().min(0).optional()),
  perCustomerLimit: numberInput(
    z.number().min(1, 'Per customer limit must be at least 1').optional(),
  ),
  isFirstOrderOnly: booleanInput.optional(),
  applicableProducts: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  active: booleanInput.optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
  subtotal: numberInput(z.number().min(0, 'Subtotal must be at least 0')),
  cartItems: z
    .array(
      z.object({
        product: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .optional(),
});