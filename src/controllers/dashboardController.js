import { asyncHandler, sendResponse } from '../utils/index.js';
import * as dashboardService from '../services/index.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  sendResponse(res, { data: stats });
});

export const getRecentOrders = asyncHandler(async (req, res) => {
  const orders = await dashboardService.getRecentOrders(req.query.limit);
  sendResponse(res, { data: orders });
});

export const getTopSellingProducts = asyncHandler(async (req, res) => {
  const products = await dashboardService.getTopSellingProducts(
    req.query.limit,
  );
  sendResponse(res, { data: products });
});

export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await dashboardService.getLowStockProducts(req.query.limit);
  sendResponse(res, { data: products });
});

export const getInventoryAlerts = asyncHandler(async (req, res) => {
  const alerts = await dashboardService.getInventoryAlerts(req.query.limit);
  sendResponse(res, { data: alerts });
});

export const getCustomersList = asyncHandler(async (req, res) => {
  const customers = await dashboardService.getCustomersList();
  sendResponse(res, {
    message: 'Customers retrieved successfully',
    data: customers,
  });
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const salesData = await dashboardService.getSalesReport();
  sendResponse(res, { data: salesData });
});
