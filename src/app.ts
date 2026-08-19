import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import ordersRouter from './routes/orders';
import uploadRouter from './routes/upload';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://yousufandsons.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json()); // <-- THIS WAS MISSING

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/products', productsRouter);
app.use('/categories', categoriesRouter);
app.use('/orders', ordersRouter);
app.use('/upload', uploadRouter);

export default app;