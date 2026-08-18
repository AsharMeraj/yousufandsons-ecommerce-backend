import { Router } from 'express';
import { db } from '../db';
import { orders, orderItems, products } from '../db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order';
import { requireAdmin } from '../middleware/requireAdmin';
import { orderRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /orders - public, guest checkout
router.post('/', orderRateLimiter, validate(createOrderSchema), async (req, res) => {
  const { customerName, customerPhone, customerEmail, addressLine1, addressLine2, city, postalCode, items } = req.body;

  try {
    const result = await db.transaction(async (tx) => {
      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      if (dbProducts.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      let totalAmount = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        const product = dbProducts.find((p) => p.id === item.productId);
        if (!product || !product.isActive) {
          throw new Error(`Product unavailable: ${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const unitPrice = parseFloat(product.price);
        totalAmount += unitPrice * item.quantity;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        });
      }

      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerName,
          customerPhone,
          customerEmail,
          addressLine1,
          addressLine2,
          city,
          postalCode,
          totalAmount: totalAmount.toFixed(2),
        })
        .returning();

      await tx.insert(orderItems).values(
        orderItemsData.map((item) => ({ ...item, orderId: newOrder.id }))
      );

      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      return newOrder;
    });

    res.status(201).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Failed to place order' });
  }
});

// GET /orders - admin only, view all orders
router.get('/:id', async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required to look up an order' });
  }

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, req.params.id as string), eq(orders.customerPhone, phone as string)));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    res.json({ ...order, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.get('/', requireAdmin, async (_req, res) => {
  const result = await db.select().from(orders);
  res.json(result);
});

// PATCH /orders/:id - admin only, update status
router.patch('/:id', requireAdmin, validate(updateOrderStatusSchema), async (req, res) => {
  const { status } = req.body;
  const [updated] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, req.params.id as string))
    .returning();
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  res.json(updated);
});

export default router;