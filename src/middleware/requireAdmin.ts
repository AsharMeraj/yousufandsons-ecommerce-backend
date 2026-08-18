import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: process.env.SUPABASE_JWKS_URL!,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(err, signingKey);
  });
}

export interface AdminRequest extends Request {
  adminEmail?: string;
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {}, (err, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });

    const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    if (!decoded.email || !allowedEmails.includes(decoded.email)) {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    req.adminEmail = decoded.email;
    next();
  });
}