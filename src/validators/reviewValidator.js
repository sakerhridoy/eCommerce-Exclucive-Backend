import { z } from 'zod';

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().nullable().optional(),
});