import { Router } from 'express';
import { db } from '../db';
import { products } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product';


const router = Router();

// GET /products - public
router.get('/', async (_req, res) => {
  const result = await db.select().from(products).where(eq(products.isActive, true));
  res.json(result);
});

// GET /products/:slug - public
router.get('/:slug', async (req, res) => {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, req.params.slug), eq(products.isActive, true)));
  if (result.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(result[0]);
});

// POST /products - admin only
router.post('/', requireAdmin, validate(createProductSchema), async (req, res) => {
  try {
    const { name, slug, description, price, stock, imageUrl, categoryId } = req.body;
    const [newProduct] = await db
      .insert(products)
      .values({ name, slug, description, price, stock, imageUrl, categoryId })
      .returning();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /products/:id - admin only
router.patch('/:id', requireAdmin, validate(updateProductSchema), async (req, res) => {
  try {
    const [updated] = await db
      .update(products)
      .set(req.body)
      .where(eq(products.id, req.params.id as string))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /products/:id - admin only, soft delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [deleted] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, req.params.id as string))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deactivated', product: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;