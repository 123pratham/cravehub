import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { api } from './routes/api.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));
app.use('/api', api);
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.name === 'ValidationError') return res.status(400).json({ message: 'The submitted data is invalid.' });
  if (err?.code === 11000) return res.status(409).json({ message: 'That value is already in use.' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
const port = Number(process.env.PORT || 5000);
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random value at least 32 characters long in backend/.env');
  try { await connectDatabase(); } catch (err) { console.error('MongoDB connection failed. Start MongoDB and check MONGODB_URI.', err); process.exit(1); }
  app.listen(port, () => console.log(`CraveHub API listening at http://localhost:${port}`));
}
if (process.env.NODE_ENV !== 'test') start();
export { app };
