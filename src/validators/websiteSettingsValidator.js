import { z } from 'zod';

const pageContentSchema = z.object({
  title: z.string().trim().max(150).optional(),
  content: z.string().max(20000).optional(),
});

export const updateSiteSettingsSchema = z.object({
  websiteName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email('Invalid email address').max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  supportHours: z.string().trim().max(200).optional(),
  privacyPolicy: pageContentSchema.optional(),
  termsOfUse: pageContentSchema.optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1, 'Question is required').max(300),
        answer: z.string().trim().min(1, 'Answer is required').max(3000),
      }),
    )
    .max(50, 'Too many FAQs')
    .optional(),
});
