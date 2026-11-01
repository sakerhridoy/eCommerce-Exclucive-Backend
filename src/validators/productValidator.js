import z from 'zod';

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),

  price: z.coerce.number().min(0, 'Price must be at least 0'),
  discountPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0, 'Stock must be at least 0'),
  featured: z.coerce.boolean().optional(),

  image: z.any().optional(),
  thumbnail: z.any().optional(),
  images: z.any().optional(),

  tags: z.preprocess(val => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [val];
      }
    }
    return val;
  }, z.array(z.string()).optional()),

  specifications: z.preprocess(
    val => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    },
    z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
  ),

  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});