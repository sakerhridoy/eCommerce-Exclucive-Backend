import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLES, normalizeRole, getPermissionsForRole } from '../utils/index.js';

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['shipping', 'billing', 'both'],
    default: 'shipping'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  _id: true
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    publicId: String,
    url: String
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.CUSTOMER,
    set: normalizeRole
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addresses: [addressSchema],
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  refreshToken: String
}, {
  timestamps: true
});

// Effective permission list derived from the user's role. Exposed to the
// frontend so buttons/menus can be hidden to match backend enforcement.
userSchema.virtual('permissions').get(function () {
  return getPermissionsForRole(this.role);
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_document, user) => {
    delete user.password;
    delete user.refreshToken;
    delete user.emailVerificationToken;
    delete user.__v;
    return user;
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// === Performance indexes (hot query paths) ===
// Admin customer listing filters by role and sorts by newest first.
userSchema.index({ role: 1, createdAt: -1 });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
