import { z } from 'zod';
import { REVIEW_STATUS } from '../utils/index.js';

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  rating: z.coerce.number().min(1, 'Rating is required').max(5),
  title: z.string().max(120).optional().nullable(),
  comment: z.string().max(2000).optional().nullable(),
});

export const reviewModerationSchema = z.object({
  status: z.enum([REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED]),
});
