import express from 'express';
import {
  getSiteSettings,
  updateSiteSettings,
} from '../controllers/websiteSettingsController.js';
import { authenticate, requirePermission, validate } from '../middlewares/index.js';
import { updateSiteSettingsSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.get('/', getSiteSettings);

router.put(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validate(updateSiteSettingsSchema),
  updateSiteSettings,
);

export default router;
