import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Our Story' },
    paragraph1: {
      type: String,
      default:
        'Launched in 2015, Exclusive is South Asia’s premier online shopping marketplace...',
    },
    paragraph2: {
      type: String,
      default: 'Exclusive has more than 1 Million products to offer...',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

export default mongoose.model('About', aboutSchema);