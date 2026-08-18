import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import ordersRouter from './routes/orders';
import uploadRouter from './routes/upload';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);
app.use('/orders', ordersRouter)
app.use('/upload', uploadRouter);

export default app;