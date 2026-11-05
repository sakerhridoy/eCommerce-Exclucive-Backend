import mongoose from 'mongoose';
import { PRODUCT_STATUS } from '../utils/index.js';

const variantSchema = new mongoose.Schema(
  {
    color: String,
    size: String,
    weight: String,
    price: Number,
    discountPrice: Number,
    stock: Number,
  },
  {
    _id: true,
  },
);

const specificationSchema = new mongoose.Schema(
  {
    key: String,
    value: String,
  },
  {
    _id: true,
  },
);

const seoSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    keywords: [String],
  },
  {
    _id: true,
  },
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    shortDescription: String,
    sku: String,
    barcode: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    warranty: {
      type: String,
      trim: true,
    },

    images: [mongoose.Schema.Types.Mixed],
    thumbnail: {
      type: mongoose.Schema.Types.Mixed,
    },
    image: {
      type: String,
    },
    variants: [variantSchema],
    tags: [String],
    specifications: [specificationSchema],
    seo: seoSchema,
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

// === Performance indexes (hot query paths) ===
// Storefront + admin listings filter by status and sort by newest/sold/price.
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, sold: -1 });
productSchema.index({ status: 1, featured: 1, createdAt: -1 });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ status: 1, price: 1 });
// Powers full-text search ($text) on the catalogue.
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Product = mongoose.model('Product', productSchema);