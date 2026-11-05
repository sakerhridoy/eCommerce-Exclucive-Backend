import express from 'express';
import * as bannerController from '../controllers/index.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { upload } from '../middlewares/upload.js';
import { bannerSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.get('/', bannerController.getBanners);
router.get(
  '/admin/list',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  bannerController.getAllBannersAdmin,
);
router.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  bannerController.getBannerById,
);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  upload.single('image'),
  validate(bannerSchema),
  bannerController.createBanner,
);
router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  upload.single('image'),
  validate(bannerSchema),
  bannerController.updateBanner,
);
router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.CONTENT_MANAGE),
  bannerController.deleteBanner,
);

export default router;
