import express from 'express';
import * as couponController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { couponSchema, applyCouponSchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.post('/validate', authenticate, validate(applyCouponSchema), couponController.validateCoupon);

router.get('/', authenticate, authorize(ROLES.ADMIN), couponController.getCoupons);
router.get('/:id', authenticate, authorize(ROLES.ADMIN), couponController.getCouponById);
router.post('/', authenticate, authorize(ROLES.ADMIN), validate(couponSchema), couponController.createCoupon);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), validate(couponSchema), couponController.updateCoupon);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), couponController.deleteCoupon);

export default router;
