import express from 'express';
import * as dashboardController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/top-selling-products', dashboardController.getTopSellingProducts);
router.get('/low-stock-products', dashboardController.getLowStockProducts);
router.get('/sales-report', dashboardController.getSalesReport);
router.get('/customers', dashboardController.getCustomersList);

export default router;
