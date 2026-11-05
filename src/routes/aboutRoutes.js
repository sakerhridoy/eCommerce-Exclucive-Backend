import express from 'express';
import {
  getAboutData,
  updateAboutData,
} from '../controllers/aboutController.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { PERMISSIONS } from '../utils/index.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', getAboutData);

router.put(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  upload.single('image'),
  updateAboutData,
);

export default router;
