import { ActivityLog } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class ActivityLogRepository extends BaseRepository {
  constructor() {
    super(ActivityLog);
  }
}

export const activityLogRepository = new ActivityLogRepository();
