import { notificationRepository } from '../repositories/index.js';
import { AppError } from '../utils/index.js';
import { getPagination, getPaginationMeta } from '../utils/index.js';

export const getNotifications = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.read !== undefined) {
    filter.read = query.read === 'true';
  }

  const notifications = await notificationRepository.find(filter, {
    skip,
    limit,
    sort: { createdAt: -1 },
  });
  const total = await notificationRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { notifications, meta };
};

export const markAsRead = async (id, userId) => {
  const notification = await notificationRepository.findOne({ _id: id });
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  notification.read = true;
  await notification.save();

  return notification;
};

export const markAllAsRead = async userId => {
  await notificationRepository.findOneAndUpdate(
    { read: false },
    { read: true },
    { many: true },
  );
};

export const deleteNotification = async (id, userId) => {
  const notification = await notificationRepository.findOne({ _id: id });
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return await notificationRepository.findByIdAndDelete(id);
};