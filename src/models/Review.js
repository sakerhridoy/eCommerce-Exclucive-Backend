import mongoose from 'mongoose';
import { REVIEW_STATUS } from '../utils/index.js';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    images: [
      {
        publicId: String,
        url: String,
      },
    ],
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.PENDING,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// One review per user per product — blocks duplicates at the database level.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
// Fast lookups of a product's approved reviews.
reviewSchema.index({ product: 1, status: 1 });

export const Review = mongoose.model('Review', reviewSchema);
