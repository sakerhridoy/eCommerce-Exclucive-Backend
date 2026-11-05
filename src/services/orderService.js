import * as XLSX from 'xlsx';
import {
  orderRepository,
  cartRepository,
  productRepository,
  couponRepository,
  notificationRepository,
  userRepository,
} from '../repositories/index.js';
import {
  AppError,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PRODUCT_STATUS,
  NOTIFICATION_TYPE,
  sendEmail,
  sendAdminAlert,
  buildInvoicePdf,
  getPagination,
  getPaginationMeta,
  buildSort,
  escapeRegex,
  buildDateRange,
} from '../utils/index.js';
import { config } from '../config/index.js';
import { emailTemplates } from './emailTemplatesService.js';
import { validateCoupon } from './couponService.js';
import {
  reserveStock,
  releaseStockItems,
  restoreStockForOrder,
} from './inventoryService.js';

const generateOrderNumber = () => {
  return (
    'ORD-' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 5).toUpperCase()
  );
};

export const placeOrder = async (userId, data) => {
  const cart = await cartRepository.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Phase 2: Create a list of product IDs that are actually being ordered
  const orderedProductIds = data.items.map(i => i.product.toString());

  const orderItems = [];
  let subtotal = 0;

  // Loop through ONLY the items that are in the request payload (selected items)
  for (const requestedItem of data.items) {
    const product = await productRepository.findById(requestedItem.product);
    if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError('Product not found', 404);
    }
    if (product.stock < requestedItem.quantity) {
      throw new AppError(`Insufficient stock for ${product.title}`, 400);
    }
    const price = product.discountPrice || product.price;

    const orderItem = {
      product: requestedItem.product,
      quantity: requestedItem.quantity,
      price,
    };

    if (
      requestedItem.variant &&
      typeof requestedItem.variant === 'object' &&
      Object.values(requestedItem.variant).some(value => value != null)
    ) {
      orderItem.variant = requestedItem.variant;
    }

    orderItems.push(orderItem);
    subtotal += price * requestedItem.quantity;
  }

  let discount = 0;
  let coupon = null;
  if (data.couponCode) {
    // Validate coupon using ONLY the ordered items
    const { coupon: foundCoupon, discount: couponDiscount } =
      await validateCoupon(data.couponCode, subtotal, orderItems, userId);
    coupon = foundCoupon;
    discount = couponDiscount;
  }

  const total = subtotal - discount;

  // Atomically reserve stock. This is the single source of truth for
  // overselling prevention — if two customers race for the last unit,
  // only one reservation can succeed.
  const reservedItems = await reserveStock(orderItems);

  if (coupon) {
    await couponRepository.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1 },
    });
  }

  let order;
  try {
    order = await orderRepository.create({
      orderNumber: generateOrderNumber(),
      user: userId,
      items: orderItems,
      subtotal,
      discount,
      coupon: coupon ? coupon._id : null,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PENDING,
      shippingAddress: data.shippingAddress,
      notes: data.notes,
    });
  } catch (error) {
    // Roll the reservation back so stock is never lost on a failed save.
    await releaseStockItems(reservedItems);
    throw error;
  }

  // Phase 2: Remove ONLY the ordered items from the user's cart, keep the unselected ones
  const remainingCartItems = cart.items.filter(
    cartItem => !orderedProductIds.includes(cartItem.product.toString()),
  );

  await cartRepository.findByIdAndUpdate(cart._id, {
    items: remainingCartItems,
    // Usually total is re-calculated based on remaining items, or if the system calculates it dynamically we can just save it.
  });

  await notificationRepository.create({
    title: 'New Order Placed',
    message: `Order ${order.orderNumber} has been placed successfully`,
    type: NOTIFICATION_TYPE.ORDER,
    user: userId,
  });

  // Order confirmation to the customer, with the invoice PDF attached.
  try {
    const populatedOrder = await orderRepository.findByOrderNumber(
      order.orderNumber,
    );

    const attachments = [];
    try {
      const pdf = await buildInvoicePdf(populatedOrder);
      attachments.push({
        filename: `invoice-${populatedOrder.orderNumber}.pdf`,
        content: pdf,
      });
    } catch (pdfError) {
      console.error('Failed to build invoice PDF:', pdfError);
    }

    await sendEmail({
      to: populatedOrder.user.email,
      ...emailTemplates.orderConfirmation(populatedOrder),
      attachments,
    });

    // Admin alert — a big order gets the highlighted variant instead of the
    // regular one so no duplicate emails are sent.
    const isBigOrder =
      Number(populatedOrder.total) >= config.email.bigOrderThreshold;
    await sendAdminAlert(
      isBigOrder
        ? emailTemplates.adminBigOrder(populatedOrder)
        : emailTemplates.adminNewOrder(populatedOrder),
    );
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }

  return await orderRepository.findByOrderNumber(order.orderNumber);
};

// Columns admins are allowed to sort the order table by.
const ADMIN_ORDER_SORT_FIELDS = [
  'orderNumber',
  'total',
  'subtotal',
  'orderStatus',
  'paymentStatus',
  'createdAt',
  'updatedAt',
];

// Match enum-like status values regardless of stored casing.
const enumEquals = value =>
  value ? new RegExp(`^${escapeRegex(value)}$`, 'i') : undefined;

export const getOrders = async (query, userId = null) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (userId) {
    filter.user = userId;
  }

  const orderStatusMatch = enumEquals(query.orderStatus);
  if (orderStatusMatch) {
    filter.orderStatus = orderStatusMatch;
  }

  const paymentStatusMatch = enumEquals(query.paymentStatus);
  if (paymentStatusMatch) {
    filter.paymentStatus = paymentStatusMatch;
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(String(query.search).trim()), 'i');
    const matchedUsers = await userRepository.find(
      { $or: [{ name: rx }, { email: rx }] },
      { select: '_id', limit: 100 },
    );
    filter.$or = [
      { orderNumber: rx },
      { user: { $in: matchedUsers.map(u => u._id) } },
    ];
  }

  const createdAt = buildDateRange(query.createdFrom, query.createdTo);
  if (createdAt) {
    filter.createdAt = createdAt;
  }

  const sort = buildSort(query.sort, ADMIN_ORDER_SORT_FIELDS, {
    createdAt: -1,
  });

  const orders = await orderRepository.find(filter, {
    skip,
    limit,
    sort,
    populate: ['user', 'items.product'],
  });
  const total = await orderRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { orders, meta };
};

export const bulkUpdateOrderStatus = async (ids = [], orderStatus) => {
  const validIds = (Array.isArray(ids) ? ids : []).filter(Boolean);
  if (validIds.length === 0) {
    throw new AppError('No orders selected', 400);
  }
  if (!orderStatus) {
    throw new AppError('Order status is required', 400);
  }

  let modified = 0;
  for (const id of validIds) {
    try {
      // Reuses the single-order flow so stock/coupon restoration,
      // notifications and emails stay consistent.
      await updateOrderStatus(id, orderStatus);
      modified += 1;
    } catch (error) {
      console.error(
        `Bulk order status update failed for ${id}:`,
        error.message,
      );
    }
  }

  return { modified };
};

export const bulkUpdatePaymentStatus = async (ids = [], paymentStatus) => {
  const validIds = (Array.isArray(ids) ? ids : []).filter(Boolean);
  if (validIds.length === 0) {
    throw new AppError('No orders selected', 400);
  }
  if (!paymentStatus) {
    throw new AppError('Payment status is required', 400);
  }

  let modified = 0;
  for (const id of validIds) {
    try {
      // Reuses the single-order flow so failed/refunded payments
      // also restore inventory.
      await updatePaymentStatus(id, paymentStatus);
      modified += 1;
    } catch (error) {
      console.error(
        `Bulk payment status update failed for ${id}:`,
        error.message,
      );
    }
  }

  return { modified };
};

export const getOrderById = async (id, userId = null) => {
  // Check if it's a 24 character hex string (MongoDB ObjectId format) using simple Regex
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  const filter = isObjectId ? { _id: id } : { orderNumber: id };

  if (userId) {
    filter.user = userId;
  }

  const order = await orderRepository.findOne(filter, {
    populate: ['user', 'items.product', 'coupon'],
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }
  return order;
};

export const trackOrder = async (orderNumber, contact) => {
  const order = await orderRepository.findOne(
    { orderNumber },
    { populate: ['user'] },
  );
  const normalizedContact = contact.trim().toLowerCase();
  const normalizedPhone = normalizedContact.replace(/\D/g, '');
  const orderPhone = order?.user?.phone?.replace(/\D/g, '');
  const isMatchingEmail =
    order?.user?.email?.toLowerCase() === normalizedContact;
  const isMatchingPhone =
    normalizedPhone.length > 0 && orderPhone === normalizedPhone;

  if (!order || (!isMatchingEmail && !isMatchingPhone)) {
    throw new AppError('Order not found for the supplied details', 404);
  }

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

export const updateOrderStatus = async (id, orderStatus) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Persist the canonical (lowercase) enum value so it matches the schema
  // enum and every case-sensitive query/aggregation.
  const nextStatus = orderStatus
    ? String(orderStatus).toLowerCase().trim()
    : order.orderStatus;

  const previousStatus = String(order.orderStatus || '')
    .toLowerCase()
    .trim();

  if (
    nextStatus === ORDER_STATUS.CANCELLED &&
    previousStatus !== ORDER_STATUS.CANCELLED
  ) {
    // Return the reserved stock exactly once (idempotent).
    await restoreStockForOrder(order);

    // Restore coupon usage limit if order is cancelled by admin
    if (order.coupon) {
      await couponRepository.findByIdAndUpdate(order.coupon, {
        $inc: { usedCount: -1 },
      });
    }
  }

  const updatedOrder = await orderRepository.findByIdAndUpdate(
    id,
    { orderStatus: nextStatus },
    { new: true },
  );

  await notificationRepository.create({
    title: 'Order Status Updated',
    message: `Order ${updatedOrder.orderNumber} status changed to ${nextStatus.toUpperCase()}`,
    type: NOTIFICATION_TYPE.ORDER,
    user: updatedOrder.user,
  });

  try {
    const populatedOrder = await orderRepository.findByOrderNumber(
      updatedOrder.orderNumber,
    );
    await sendEmail({
      to: populatedOrder.user.email,
      ...emailTemplates.orderStatusUpdate(populatedOrder),
    });
  } catch (error) {
    console.error('Failed to send order status update email:', error);
  }

  return await orderRepository.findByOrderNumber(updatedOrder.orderNumber);
};

export const updatePaymentStatus = async (id, paymentStatus) => {
  const order = await orderRepository.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const nextPaymentStatus = paymentStatus
    ? String(paymentStatus).toLowerCase().trim()
    : order.paymentStatus;

  const isFailedOrRefunded = [
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.REFUNDED,
  ].includes(nextPaymentStatus);
  const alreadyCancelled =
    String(order.orderStatus || '').toLowerCase() === ORDER_STATUS.CANCELLED;

  const update = { paymentStatus: nextPaymentStatus };

  // A failed / refunded payment means the sale is off — cancel the order
  // and hand the reserved stock back to inventory.
  if (isFailedOrRefunded && !alreadyCancelled) {
    update.orderStatus = ORDER_STATUS.CANCELLED;
  }

  const updatedOrder = await orderRepository.findByIdAndUpdate(id, update, {
    new: true,
  });

  if (isFailedOrRefunded) {
    await restoreStockForOrder(order);
  }

  return await orderRepository.findByOrderNumber(updatedOrder.orderNumber);
};

/**
 * Payment provider callbacks (fail / cancel / ipn-fail) route through here so
 * stock is always returned and the order is marked cancelled consistently.
 */
export const handlePaymentFailure = async (
  orderId,
  paymentStatus = PAYMENT_STATUS.FAILED,
) => {
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const alreadyCancelled =
    String(order.orderStatus || '').toLowerCase() === ORDER_STATUS.CANCELLED;

  const update = {
    paymentStatus: String(paymentStatus).toLowerCase().trim(),
  };
  if (!alreadyCancelled) {
    update.orderStatus = ORDER_STATUS.CANCELLED;
  }

  await orderRepository.findByIdAndUpdate(orderId, update);
  await restoreStockForOrder(order);

  return await orderRepository.findByOrderNumber(order.orderNumber);
};

export const cancelOrder = async (orderId, userId) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to cancel this order', 403);
  }

  const currentStatus = String(order.orderStatus || '')
    .toLowerCase()
    .trim();

  if (
    currentStatus !== ORDER_STATUS.PENDING &&
    currentStatus !== ORDER_STATUS.PROCESSING
  ) {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  const updatedOrder = await orderRepository.findByIdAndUpdate(
    orderId,
    { orderStatus: ORDER_STATUS.CANCELLED },
    { new: true },
  );

  // Return the reserved stock exactly once (idempotent).
  await restoreStockForOrder(order);

  // Restore coupon usage limit if order is cancelled by customer
  if (order.coupon) {
    await couponRepository.findByIdAndUpdate(order.coupon, {
      $inc: { usedCount: -1 },
    });
  }

  await notificationRepository.create({
    title: 'Order Cancelled',
    message: `Order ${updatedOrder.orderNumber} has been cancelled successfully.`,
    type: NOTIFICATION_TYPE.ORDER,
    user: userId,
  });

  return updatedOrder;
};

export const exportOrdersExcelService = async () => {
  const orders = await orderRepository.find(
    {},
    {
      sort: { createdAt: -1 },
      populate: ['user', 'items.product'],
    },
  );

  const excelData = orders.map((order, index) => ({
    SL: index + 1,
    'Order ID':
      order.orderNumber || order._id.toString().slice(-6).toUpperCase(),
    'Customer Name': order.user?.name || 'Guest',
    Email: order.user?.email || 'N/A',
    Phone: order.shippingAddress?.phone || 'N/A',
    'Order Date': new Date(order.createdAt).toLocaleDateString(),
    'Total Items': order.items?.length || 0,
    'Grand Total (Tk)': order.total,
    'Order Status': order.orderStatus,
    'Payment Status': order.paymentStatus || 'PENDING',
    'Payment Method': order.paymentMethod || 'COD',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders Report');

  // Buffer the workbook to return as a downloadable file
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};