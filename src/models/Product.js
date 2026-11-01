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
    featured: {
      type: Boolean,
      default: false,
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

export const Product = mongoose.model('Product', productSchema);