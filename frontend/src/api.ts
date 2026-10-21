import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use(r => r, e => { const message = e?.response?.data?.message || 'Could not connect to CraveHub. Is the API running?'; return Promise.reject(new Error(message)); });
export type MenuItem = { _id: string; name: string; description?: string; price: number; category: string; vegetarian: boolean; available: boolean; image?: string };
export type Restaurant = { _id: string; name: string; slug: string; description?: string; cuisines: string[]; rating: number; ratingCount: number; costForTwo: number; deliveryMinutes: number; deliveryFee: number; image: string; coverImage?: string; discount?: string; vegetarian: boolean; isOpen: boolean; address?: string; menu?: MenuItem[] };
export type User = { id: string; name: string; email: string; phone?: string; role: string };
export type Cart = { _id: string; restaurant: Restaurant; items: { foodId: string; name: string; price: number; quantity: number; image?: string }[] };
