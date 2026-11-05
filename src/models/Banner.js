import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    buttonText: {
      type: String,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['hero', 'category'],
      default: 'hero',
    },
    order: {
      type: Number,
      default: 0,
    },
    image: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Banner = mongoose.model('Banner', bannerSchema);
