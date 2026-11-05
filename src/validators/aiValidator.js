import { z } from 'zod';

export const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(1000, 'Message is too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(800),
      }),
    )
    .max(8, 'Too many previous messages')
    .optional(),
});
