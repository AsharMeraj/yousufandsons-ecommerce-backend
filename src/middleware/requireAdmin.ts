import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL(process.env.SUPABASE_JWKS_URL!));

export interface AdminRequest extends Request {
  adminEmail?: string;
}

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { payload } = await jwtVerify(token, JWKS);
    const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim());
    const email = payload.email as string | undefined;

    if (!email || !allowedEmails.includes(email)) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    req.adminEmail = email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}