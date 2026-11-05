import express from 'express';
import * as couponController from '../controllers/index.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { couponSchema, applyCouponSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.post('/validate', authenticate, validate(applyCouponSchema), couponController.validateCoupon);

router.get('/', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponController.getCoupons);
router.get('/:id', authenticate, requirePermission(PERMISSIONS.COUPON_VIEW), couponController.getCouponById);
router.post('/', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), validate(couponSchema), couponController.createCoupon);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), validate(couponSchema), couponController.updateCoupon);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.COUPON_MANAGE), couponController.deleteCoupon);

export default router;
