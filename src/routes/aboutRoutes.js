import express from 'express';
import {
  getAboutData,
  updateAboutData,
} from '../controllers/aboutController.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { ROLES } from '../utils/index.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', getAboutData);

router.put(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  upload.single('image'),
  updateAboutData,
);

export default router;
