import { Router } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../middleware/requireAdmin';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/categories';

const router = Router();

// GET /categories - public
router.get('/', async (_req, res) => {
  const result = await db.select().from(categories).where(eq(categories.isActive, true));
  res.json(result);
});

// POST /categories - admin only
router.post('/', requireAdmin, validate(createCategorySchema), async (req, res) => {
  try {
    const { name, slug } = req.body;
    const [newCategory] = await db.insert(categories).values({ name, slug }).returning();
    res.status(201).json(newCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /categories/:id - admin only
router.patch('/:id', requireAdmin, validate(updateCategorySchema), async (req, res) => {
  try {
    const [updated] = await db
      .update(categories)
      .set(req.body)
      .where(eq(categories.id, req.params.id as string))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /categories/:id - admin only, soft delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [deleted] = await db
      .update(categories)
      .set({ isActive: false })
      .where(eq(categories.id, req.params.id as string))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deactivated', category: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;