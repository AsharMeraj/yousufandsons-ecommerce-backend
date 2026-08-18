import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number'),
  stock: z.number().int().nonnegative(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().uuid().optional(),
});

export const updateProductSchema = createProductSchema.partial();