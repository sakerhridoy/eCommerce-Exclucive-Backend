import mongoose from 'mongoose';
import { PRODUCT_STATUS } from '../utils/index.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      publicId: String,
      url: String,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },
    image: {
      publicId: String,
      url: String,
    },
    icon: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  },
);

export const Category = mongoose.model('Category', categorySchema);
