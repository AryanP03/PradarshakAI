import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { AUTH_COOKIE_NAME } from '../utils/authCookies';

const JWT_SECRET = process.env.JWT_SECRET || 'nsfdc-dev-secret-change-in-production';

export interface UserAuthRequest extends Request {
  userId?: number;
  userEmail?: string;
}

function extractToken(req: Request): string | null {
  // 1. Primary secure mechanism: HttpOnly cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    const cookieToken = req.cookies[AUTH_COOKIE_NAME];
    if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
      return cookieToken.trim();
    }
  }

  // 2. Backward-compatible fallback: Authorization Bearer header
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const headerToken = auth.slice(7).trim();
    if (headerToken.length > 0) {
      return headerToken;
    }
  }

  return null;
}

export async function requireUser(req: UserAuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    if (!payload?.userId) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }
    const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.userId]);
    if (rows.length === 0) {
      res.status(401).json({ error: 'User account not found. Please log in again.' });
      return;
    }
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalUser(req: UserAuthRequest, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      if (payload?.userId) {
        const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [payload.userId]);
        if (rows.length > 0) {
          req.userId = payload.userId;
          req.userEmail = payload.email;
        }
      }
    } catch { /* ignore */ }
  }
  next();
}

