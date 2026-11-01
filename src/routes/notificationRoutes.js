import express from 'express';
import * as notificationController from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
