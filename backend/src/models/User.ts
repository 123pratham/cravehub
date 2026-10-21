import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }, phone: { type: String, default: '' },
  role: { type: String, enum: ['CUSTOMER', 'RESTAURANT_OWNER', 'ADMIN'], default: 'CUSTOMER' }
}, { timestamps: true });
export const User = mongoose.model('User', UserSchema);
