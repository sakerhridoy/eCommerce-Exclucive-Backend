import express from 'express';
import * as orderController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import {
  placeOrderSchema,
  trackOrderSchema,
  updateOrderStatusSchema,
} from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.post('/track', validate(trackOrderSchema), orderController.trackOrder);

router.use(authenticate);

router.post('/', validate(placeOrderSchema), orderController.placeOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

router.put(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
router.put(
  '/:id/payment-status',
  authorize(ROLES.ADMIN),
  orderController.updatePaymentStatus,
);

router.put(
  '/:id/cancel',
  authorize(ROLES.CUSTOMER),
  orderController.cancelOrder,
);

export default router;