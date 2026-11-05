import { z } from 'zod';

// multipart/form-data থেকে active "true"/"false" string আকারে আসে
const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform(value => value === true || value === 'true');

export const bannerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  label: z.string().trim().max(150).optional(),
  subtitle: z.string().trim().max(300).optional(),
  buttonText: z.string().trim().max(60).optional(),
  link: z.string().trim().max(300).optional(),
  type: z.enum(['hero', 'category']).optional(),
  order: z.coerce.number().int().min(0).optional(),
  active: booleanish.optional(),
});
