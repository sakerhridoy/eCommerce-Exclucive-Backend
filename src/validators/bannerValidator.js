import z from 'zod';

export const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  link: z.string().optional(),
  active: z.boolean().optional()
});
