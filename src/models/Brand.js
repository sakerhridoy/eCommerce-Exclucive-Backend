import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  logo: {
    publicId: String,
    url: String
  }
}, {
  timestamps: true
});

export const Brand = mongoose.model('Brand', brandSchema);
