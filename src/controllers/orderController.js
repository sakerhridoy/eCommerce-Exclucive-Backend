import { asyncHandler, sendResponse } from '../utils/index.js';
import * as orderService from '../services/index.js';
import { ROLES } from '../utils/index.js';

export const placeOrder = asyncHandler(async (req, res) => {
  if (req.body.items && Array.isArray(req.body.items)) {
    req.body.items = req.body.items.map(item => {
      if (
        !item.variant ||
        item.variant === null ||
        item.variant === 'null' ||
        typeof item.variant !== 'object'
      ) {
        delete item.variant;
      }
      return item;
    });
  }

  const order = await orderService.placeOrder(req.user._id, req.body);

  sendResponse(res, {
    message: 'Order placed successfully',
    data: order,
    statusCode: 201,
  });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await orderService.trackOrder(
    req.body.orderNumber,
    req.body.contact,
  );
  sendResponse(res, { data: order });
});

export const getOrders = asyncHandler(async (req, res) => {
  const userId = req.user.role === ROLES.CUSTOMER ? req.user._id : null;

  const query = { ...req.query };
  if (query.orderStatus)
    query.orderStatus = query.orderStatus.toUpperCase().trim();
  if (query.paymentStatus)
    query.paymentStatus = query.paymentStatus.toUpperCase().trim();

  const result = await orderService.getOrders(query, userId);
  sendResponse(res, {
    data: result.orders,
    meta: result.meta,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const userId = req.user.role === ROLES.CUSTOMER ? req.user._id : null;
  const order = await orderService.getOrderById(req.params.id, userId);
  sendResponse(res, { data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const sanitizedStatus = req.body.orderStatus
    ? req.body.orderStatus.toUpperCase().trim()
    : undefined;

  const order = await orderService.updateOrderStatus(
    req.params.id,
    sanitizedStatus,
  );
  sendResponse(res, {
    message: 'Order status updated',
    data: order,
  });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const sanitizedPaymentStatus = req.body.paymentStatus
    ? req.body.paymentStatus.toUpperCase().trim()
    : undefined;

  const order = await orderService.updatePaymentStatus(
    req.params.id,
    sanitizedPaymentStatus,
  );
  sendResponse(res, {
    message: 'Payment status updated',
    data: order,
  });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user._id);
  sendResponse(res, {
    message: 'Order cancelled successfully',
    data: order,
  });
});

// ================= Admin: Get All Orders =================
export const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const query = { ...req.query };
  if (query.orderStatus)
    query.orderStatus = query.orderStatus.toUpperCase().trim();
  if (query.paymentStatus)
    query.paymentStatus = query.paymentStatus.toUpperCase().trim();

  const result = await orderService.getOrders(query, null);
  sendResponse(res, {
    data: result.orders,
    meta: result.meta,
  });
});