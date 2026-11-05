import express from 'express';
import * as adminUserController from '../controllers/index.js';
import {
  authenticate,
  requirePermission,
  validate,
} from '../middlewares/index.js';
import {
  createAdminUserSchema,
  updateAdminUserSchema,
} from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

// Staff management is restricted to roles holding `user:manage`.
router.use(authenticate, requirePermission(PERMISSIONS.USER_MANAGE));

router.get('/', adminUserController.getStaff);
router.post(
  '/',
  validate(createAdminUserSchema),
  adminUserController.createStaff,
);
router.put(
  '/:id',
  validate(updateAdminUserSchema),
  adminUserController.updateStaff,
);
router.delete('/:id', adminUserController.deleteStaff);

export default router;
