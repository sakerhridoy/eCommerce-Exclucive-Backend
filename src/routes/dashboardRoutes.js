import express from 'express';
import * as dashboardController from '../controllers/index.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.use(authenticate, requirePermission(PERMISSIONS.DASHBOARD_VIEW));

router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/top-selling-products', dashboardController.getTopSellingProducts);
router.get('/low-stock-products', dashboardController.getLowStockProducts);
router.get('/inventory-alerts', dashboardController.getInventoryAlerts);
router.get('/sales-report', dashboardController.getSalesReport);
router.get('/customers', dashboardController.getCustomersList);

export default router;