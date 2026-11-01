import mongoose from 'mongoose';
import { ACTIVITY_TYPE } from '../utils/index.js';

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ACTIVITY_TYPE),
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
