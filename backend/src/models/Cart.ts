import mongoose, { Schema } from 'mongoose';
const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{ foodId: { type: Schema.Types.ObjectId, required: true }, name: String, price: Number, quantity: { type: Number, min: 1, max: 20 }, image: String }]
}, { timestamps: true });
export const Cart = mongoose.model('Cart', CartSchema);
