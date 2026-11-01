import mongoose from 'mongoose';
import { DISCOUNT_TYPE } from '../utils/index.js';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: Object.values(DISCOUNT_TYPE),
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  minimumPurchase: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Coupon = mongoose.model('Coupon', couponSchema);
