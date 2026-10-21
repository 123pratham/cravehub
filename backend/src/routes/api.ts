import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Restaurant } from '../models/Restaurant.js';
import { User } from '../models/User.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const api = Router();
const fail = (res: any, status: number, message: string) => res.status(status).json({ message });
const userSafe = (u: any) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', role: u.role });
const tokenFor = (id: string) => jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });

api.post('/auth/register', asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(80), email: z.string().email().max(254), password: z.string().min(8).max(100) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, parsed.error.issues[0]?.message || 'Please check your details.');
  const email = parsed.data.email.toLowerCase();
  if (await User.exists({ email })) return fail(res, 409, 'An account with this email already exists.');
  const user = await User.create({ name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: 'CUSTOMER' });
  res.cookie('cravehub_session', tokenFor(user.id), cookieOptions()).status(201).json({ user: userSafe(user) });
}));
api.post('/auth/login', asyncHandler(async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Enter a valid email and password.');
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return fail(res, 401, 'Email or password is incorrect.');
  res.cookie('cravehub_session', tokenFor(user.id), cookieOptions()).json({ user: userSafe(user) });
}));
api.post('/auth/logout', (_req, res) => res.clearCookie('cravehub_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' }).json({ message: 'Signed out.' }));
api.get('/auth/me', requireAuth, (req, res) => res.json({ user: (req as AuthedRequest).user }));
api.patch('/auth/profile', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: z.string().trim().max(20).optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Please check the profile fields.');
  const user = await User.findByIdAndUpdate((req as AuthedRequest).user!.id, { $set: parsed.data }, { new: true });
  res.json({ user: userSafe(user) });
}));

api.get('/health', (_req, res) => res.json({ status: 'ok', service: 'cravehub-api', time: new Date().toISOString() }));
api.get('/categories', asyncHandler(async (_req, res) => {
  const docs = await Restaurant.distinct('cuisines'); res.json({ data: docs });
}));
api.get('/restaurants', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(24, Math.max(1, Number(req.query.limit) || 12));
  const q = String(req.query.q || '').trim().slice(0, 80), cuisine = String(req.query.cuisine || '').slice(0, 50);
  const filter: Record<string, any> = {};
  if (q) filter.$or = [{ name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { cuisines: { $regex: q, $options: 'i' } }, { 'menu.name': { $regex: q, $options: 'i' } }];
  if (cuisine && cuisine !== 'All') filter.cuisines = cuisine;
  if (req.query.veg === 'true') filter.vegetarian = true;
  if (req.query.minRating) filter.rating = { $gte: Math.min(5, Math.max(0, Number(req.query.minRating) || 0)) };
  const sortMap: Record<string, any> = { rating: { rating: -1 }, cost: { costForTwo: 1 }, delivery: { deliveryMinutes: 1 }, relevance: { rating: -1, ratingCount: -1 } };
  const [data, total] = await Promise.all([Restaurant.find(filter).sort(sortMap[String(req.query.sort)] || sortMap.relevance).skip((page - 1) * limit).limit(limit).lean(), Restaurant.countDocuments(filter)]);
  res.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}));
api.get('/restaurants/:id', asyncHandler(async (req, res) => {
  const doc = await Restaurant.findOne({ $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(req.params.id) ? req.params.id : null }, { slug: req.params.id }] }).lean();
  if (!doc) return fail(res, 404, 'Restaurant not found.'); res.json({ data: doc });
}));
api.get('/restaurants/:id/menu', asyncHandler(async (req, res) => {
  const doc = await Restaurant.findOne({ $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(req.params.id) ? req.params.id : null }, { slug: req.params.id }] }).select('name menu').lean();
  if (!doc) return fail(res, 404, 'Restaurant not found.'); res.json({ data: doc.menu, restaurant: { name: doc.name } });
}));
api.get('/food-items/:id', asyncHandler(async (req, res) => {
  const doc = await Restaurant.findOne({ 'menu._id': req.params.id }, { name: 1, 'menu.$': 1 }).lean();
  if (!doc?.menu?.[0]) return fail(res, 404, 'Food item not found.'); res.json({ data: { ...doc.menu[0], restaurantName: doc.name } });
}));
api.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80); if (!q) return res.json({ data: [] });
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const data = await Restaurant.find({ $or: [{ name: { $regex: escaped, $options: 'i' } }, { cuisines: { $regex: escaped, $options: 'i' } }, { 'menu.name': { $regex: escaped, $options: 'i' } }] }).limit(8).select('name slug cuisines rating image menu.name').lean();
  res.json({ data });
}));

api.get('/cart', requireAuth, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: (req as AuthedRequest).user!.id }).populate('restaurant', 'name slug deliveryFee').lean();
  if (!cart) return res.json({ data: null, totals: { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 } });
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0), deliveryFee = (cart.restaurant as any)?.deliveryFee || 0, tax = Math.round(subtotal * 0.05);
  res.json({ data: cart, totals: { subtotal, deliveryFee, tax, total: subtotal + deliveryFee + tax } });
}));
api.post('/cart/items', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ restaurantId: z.string().min(1), foodId: z.string().min(1), quantity: z.number().int().min(1).max(20).default(1), replace: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, 'Invalid item or quantity.');
  const { restaurantId, foodId, quantity } = parsed.data;
  const restaurant = await Restaurant.findById(restaurantId); if (!restaurant) return fail(res, 404, 'Restaurant not found.');
  const item = restaurant.menu.id(foodId); if (!item || !item.available) return fail(res, 409, 'This dish is currently unavailable.');
  let cart = await Cart.findOne({ user: (req as AuthedRequest).user!.id });
  if (cart && String(cart.restaurant) !== restaurantId) {
    if (!parsed.data.replace) return fail(res, 409, 'Your cart has items from another restaurant. Send replace: true to start a new cart.');
    cart.restaurant = restaurant._id; cart.items = [];
  }
  if (!cart) cart = new Cart({ user: (req as AuthedRequest).user!.id, restaurant: restaurant._id, items: [] });
  const existing = cart.items.find(i => String(i.foodId) === foodId);
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else cart.items.push({ foodId: item._id, name: item.name, price: item.price, quantity, image: item.image });
  await cart.save(); res.json({ message: 'Added to your cart.', data: cart });
}));
api.patch('/cart/items/:itemId', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ quantity: z.number().int().min(0).max(20) }).safeParse(req.body); if (!parsed.success) return fail(res, 400, 'Quantity must be between 0 and 20.');
  const cart = await Cart.findOne({ user: (req as AuthedRequest).user!.id }); if (!cart) return fail(res, 404, 'Cart is empty.');
  const item = cart.items.find(i => String(i.foodId) === req.params.itemId); if (!item) return fail(res, 404, 'Cart item not found.');
  if (parsed.data.quantity === 0) cart.items = cart.items.filter(i => String(i.foodId) !== req.params.itemId) as any; else item.quantity = parsed.data.quantity;
  if (!cart.items.length) await Cart.deleteOne({ _id: cart._id }); else await cart.save(); res.json({ message: 'Cart updated.' });
}));
api.delete('/cart/items/:itemId', requireAuth, asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: (req as AuthedRequest).user!.id }); if (!cart) return res.json({ message: 'Cart is empty.' });
  cart.items = cart.items.filter(i => String(i.foodId) !== req.params.itemId) as any;
  if (!cart.items.length) await Cart.deleteOne({ _id: cart._id }); else await cart.save(); res.json({ message: 'Item removed.' });
}));
api.delete('/cart', requireAuth, asyncHandler(async (req, res) => { await Cart.deleteOne({ user: (req as AuthedRequest).user!.id }); res.json({ message: 'Cart cleared.' }); }));

api.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const parsed = z.object({ address: z.object({ recipient: z.string().min(2).max(80), phone: z.string().min(8).max(20), line1: z.string().min(4).max(180), city: z.string().min(2).max(80), state: z.string().min(2).max(80), postalCode: z.string().min(4).max(12), instructions: z.string().max(300).optional() }), paymentMethod: z.enum(['COD', 'DEMO']), demoResult: z.enum(['success', 'failure']).optional() }).safeParse(req.body);
  if (!parsed.success) return fail(res, 400, parsed.error.issues[0]?.message || 'Please enter a valid delivery address.');
  const cart = await Cart.findOne({ user: (req as AuthedRequest).user!.id }); if (!cart || !cart.items.length) return fail(res, 400, 'Your cart is empty.');
  const restaurant = await Restaurant.findById(cart.restaurant); if (!restaurant || !restaurant.isOpen) return fail(res, 409, 'This restaurant is currently closed.');
  const snapshots: any[] = [];
  for (const cItem of cart.items) { const actual = restaurant.menu.id(cItem.foodId); if (!actual || !actual.available) return fail(res, 409, `${cItem.name} is no longer available.`); snapshots.push({ foodId: actual._id, name: actual.name, price: actual.price, quantity: cItem.quantity }); }
  const subtotal = snapshots.reduce((sum, i) => sum + i.price * i.quantity, 0), deliveryFee = restaurant.deliveryFee || 0, tax = Math.round(subtotal * 0.05);
  const paymentStatus = parsed.data.paymentMethod === 'COD' ? 'PENDING' : parsed.data.demoResult === 'failure' ? 'DEMO_FAILED' : 'DEMO_SUCCESS';
  if (paymentStatus === 'DEMO_FAILED') return res.status(402).json({ message: 'Demo payment failed. You can retry checkout.', paymentStatus });
  const order = await Order.create({ user: (req as AuthedRequest).user!.id, restaurant: restaurant._id, restaurantName: restaurant.name, items: snapshots, subtotal, deliveryFee, tax, total: subtotal + deliveryFee + tax, address: parsed.data.address, paymentMethod: parsed.data.paymentMethod, paymentStatus, status: 'PLACED', statusHistory: [{ status: 'PLACED', at: new Date() }] });
  await Cart.deleteOne({ _id: cart._id }); res.status(201).json({ data: order, message: 'Order placed successfully.' });
}));
api.get('/orders/my', requireAuth, asyncHandler(async (req, res) => { const data = await Order.find({ user: (req as AuthedRequest).user!.id }).sort({ createdAt: -1 }).limit(50).lean(); res.json({ data }); }));
api.get('/orders/:id', requireAuth, asyncHandler(async (req, res) => { const order = await Order.findOne({ _id: req.params.id, user: (req as AuthedRequest).user!.id }).lean(); if (!order) return fail(res, 404, 'Order not found.'); res.json({ data: order }); }));
api.post('/orders/:id/cancel', requireAuth, asyncHandler(async (req, res) => { const order = await Order.findOne({ _id: req.params.id, user: (req as AuthedRequest).user!.id }); if (!order) return fail(res, 404, 'Order not found.'); if (!['PLACED', 'CONFIRMED'].includes(order.status)) return fail(res, 409, 'This order can no longer be cancelled.'); order.status = 'CANCELLED'; order.statusHistory.push({ status: 'CANCELLED', at: new Date() } as any); await order.save(); res.json({ data: order, message: 'Order cancelled.' }); }));
