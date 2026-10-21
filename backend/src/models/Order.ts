import mongoose, { Schema } from 'mongoose';
const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true }, restaurantName: String,
  items: [{ foodId: Schema.Types.ObjectId, name: String, price: Number, quantity: Number }],
  subtotal: Number, deliveryFee: Number, tax: Number, total: Number,
  address: { recipient: String, phone: String, line1: String, city: String, state: String, postalCode: String, instructions: String },
  paymentMethod: { type: String, enum: ['COD', 'DEMO'], required: true }, paymentStatus: { type: String, enum: ['PENDING', 'DEMO_SUCCESS', 'DEMO_FAILED'], default: 'PENDING' },
  status: { type: String, enum: ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], default: 'PLACED' }, statusHistory: [{ status: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });
export const Order = mongoose.model('Order', OrderSchema);
