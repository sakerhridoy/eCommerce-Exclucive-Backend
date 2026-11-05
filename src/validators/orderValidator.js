import z from 'zod';
import { PAYMENT_METHOD, ORDER_STATUS } from '../utils/index.js';

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().min(1, 'Product ID is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be non-negative'),
        variant: z.any().optional(),
      }),
    )
    .min(1, 'At least one item is required to place an order'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone is required'),
  }),
  paymentMethod: z.enum(Object.values(PAYMENT_METHOD)),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(Object.values(ORDER_STATUS)),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Order number is required'),
  contact: z.string().trim().min(3, 'Email or phone is required'),
});
