import mongoose from 'mongoose';

const socialLinksSchema = new mongoose.Schema({
  facebook: String,
  twitter: String,
  instagram: String,
  linkedin: String,
  youtube: String
}, {
  _id: true
});

const seoSchema = new mongoose.Schema({
  title: String,
  description: String,
  keywords: [String]
}, {
  _id: true
});

const pageContentSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  content: { type: String, default: '' }
}, {
  _id: false
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true }
}, {
  _id: true
});

const websiteSettingsSchema = new mongoose.Schema({
  logo: {
    publicId: String,
    url: String
  },
  favicon: {
    publicId: String,
    url: String
  },
  websiteName: {
    type: String,
    required: true
  },
  email: String,
  phone: String,
  address: { type: String, trim: true },
  supportHours: {
    type: String,
    trim: true,
    default: 'We are available 24/7, 7 days a week.'
  },
  privacyPolicy: pageContentSchema,
  termsOfUse: pageContentSchema,
  faqs: [faqSchema],
  socialLinks: socialLinksSchema,
  footer: String,
  seo: seoSchema
}, {
  timestamps: true
});

export const WebsiteSettings = mongoose.model('WebsiteSettings', websiteSettingsSchema);
