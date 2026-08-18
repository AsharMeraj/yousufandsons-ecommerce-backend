import rateLimit from 'express-rate-limit';

export const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 orders per IP per window
  message: { error: 'Too many orders placed. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});