import mongoose, { Schema } from 'mongoose';
const MenuItemSchema = new Schema({
  name: { type: String, required: true, trim: true }, description: { type: String, default: '' },
  price: { type: Number, required: true, min: 1 }, category: { type: String, default: 'Popular' },
  vegetarian: { type: Boolean, default: false }, available: { type: Boolean, default: true }, image: { type: String, default: '' }
}, { _id: true });
const RestaurantSchema = new Schema({
  name: { type: String, required: true, index: true }, slug: { type: String, required: true, unique: true },
  description: String, cuisines: [String], rating: { type: Number, min: 0, max: 5, default: 4.2 },
  ratingCount: { type: Number, default: 0 }, costForTwo: { type: Number, default: 400 },
  deliveryMinutes: { type: Number, default: 30 }, deliveryFee: { type: Number, default: 25 },
  image: String, coverImage: String, discount: String, vegetarian: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: true }, address: String, menu: [MenuItemSchema]
}, { timestamps: true });
RestaurantSchema.index({ name: 'text', cuisines: 'text', 'menu.name': 'text' });
export const Restaurant = mongoose.model('Restaurant', RestaurantSchema);
