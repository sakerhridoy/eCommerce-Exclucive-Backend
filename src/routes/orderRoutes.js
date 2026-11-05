import express from 'express';
import * as orderController from '../controllers/index.js';
import {
  authenticate,
  authorize,
  requirePermission,
  orderLimiter,
} from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import {
  placeOrderSchema,
  trackOrderSchema,
  updateOrderStatusSchema,
} from '../validators/index.js';
import { ROLES, PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.post('/track', validate(trackOrderSchema), orderController.trackOrder);

router.use(authenticate);

// ================= Admin listing + bulk actions =================
router.get(
  '/admin/list',
  requirePermission(PERMISSIONS.ORDER_VIEW),
  orderController.getAllOrdersAdmin,
);
router.patch(
  '/admin/bulk/status',
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  orderController.bulkUpdateOrderStatus,
);
router.patch(
  '/admin/bulk/payment-status',
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  orderController.bulkUpdatePaymentStatus,
);

router.get(
  '/export/excel',
  requirePermission(PERMISSIONS.ORDER_VIEW),
  orderController.exportOrdersExcel,
);
router.post(
  '/',
  orderLimiter,
  validate(placeOrderSchema),
  orderController.placeOrder,
);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);

router.put(
  '/:id/status',
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
router.put(
  '/:id/payment-status',
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  orderController.updatePaymentStatus,
);

router.put(
  '/:id/cancel',
  authorize(ROLES.CUSTOMER),
  orderController.cancelOrder,
);

export default router;