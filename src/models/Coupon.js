import mongoose from 'mongoose';
import { DISCOUNT_TYPE } from '../utils/index.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true, // Added for extra safety against accidental spaces
    },
    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0, // Discount cannot be negative
    },
    maxDiscountAmount: {
      type: Number,
      default: null, // Only applicable for PERCENTAGE type (e.g., 20% off up to 500 BDT)
    },
    minimumPurchase: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited total uses (until expiry)
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      default: 1, // Defaults to 1 use per customer
    },
    isFirstOrderOnly: {
      type: Boolean,
      default: false, // True if coupon is only for new customers
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Empty array means applicable to ALL products
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Empty array means applicable to ALL categories
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Coupon = mongoose.model('Coupon', couponSchema);