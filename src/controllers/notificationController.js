import { asyncHandler, sendResponse } from '../utils/index.js';
import * as notificationService from '../services/index.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  sendResponse(res, {
    data: result.notifications,
    meta: result.meta
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  sendResponse(res, {
    message: 'Notification marked as read',
    data: notification
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  sendResponse(res, { message: 'All notifications marked as read' });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(req.params.id, req.user._id);
  sendResponse(res, {
    message: 'Notification deleted',
    data: notification
  });
});
