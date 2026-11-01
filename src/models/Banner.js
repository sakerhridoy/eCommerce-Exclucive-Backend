import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    publicId: { type: String, required: true },
    url: { type: String, required: true }
  },
  link: String,
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Banner = mongoose.model('Banner', bannerSchema);
