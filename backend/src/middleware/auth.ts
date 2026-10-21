import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
export type AuthedRequest = Request & { user?: { id: string; role: string; name: string; email: string } };
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.cravehub_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined);
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is missing');
    const payload = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(payload.id).select('name email role');
    if (!user) return res.status(401).json({ message: 'Session is no longer valid.' });
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch { res.status(401).json({ message: 'Your session expired. Please sign in again.' }); }
}
export function requireRole(...roles: string[]) { return (req: AuthedRequest, res: Response, next: NextFunction) => req.user && roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission to do that.' }); }
