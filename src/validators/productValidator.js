import z from 'zod';

// Multipart form-data always delivers values as strings. These helpers turn
// the raw strings back into the shape the schema/DB expects.
const preprocessBoolean = z.preprocess(value => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const parseJson = value => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
};

const parseJsonArray = value => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseKeywords = value => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [trimmed];
  } catch {
    return trimmed
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
};

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  warranty: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),

  price: z.coerce.number().min(0, 'Price must be at least 0'),
  discountPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().min(0, 'Stock must be at least 0'),

  featured: preprocessBoolean.optional(),
  bestSeller: preprocessBoolean.optional(),

  image: z.any().optional(),
  thumbnail: z.any().optional(),
  images: z.any().optional(),
  imageMeta: z.preprocess(parseJsonArray, z.array(z.any()).optional()),

  tags: z.preprocess(parseKeywords, z.array(z.string()).optional()),

  variants: z.preprocess(
    parseJsonArray,
    z
      .array(
        z.object({
          color: z.string().optional(),
          size: z.string().optional(),
          weight: z.string().optional(),
          price: z.coerce.number().min(0).optional(),
          discountPrice: z.coerce.number().min(0).optional(),
          stock: z.coerce.number().min(0).optional(),
        }),
      )
      .optional(),
  ),

  specifications: z.preprocess(
    parseJsonArray,
    z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
        }),
      )
      .optional(),
  ),

  seo: z.preprocess(
    parseJson,
    z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.preprocess(
          parseKeywords,
          z.array(z.string()).optional(),
        ),
      })
      .optional(),
  ),
});
