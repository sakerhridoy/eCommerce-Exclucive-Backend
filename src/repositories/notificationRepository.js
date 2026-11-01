import { Notification } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  async findByUser(userId, options = {}) {
    return await this.find({ user: userId }, options);
  }
}

export const notificationRepository = new NotificationRepository();
