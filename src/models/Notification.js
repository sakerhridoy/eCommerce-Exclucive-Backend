import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../utils/index.js';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPE),
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export const Notification = mongoose.model('Notification', notificationSchema);
