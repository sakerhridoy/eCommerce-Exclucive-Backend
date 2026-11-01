import {
  orderRepository,
  cartRepository,
  productRepository,
  couponRepository,
  notificationRepository,
} from '../repositories/index.js';
import {
  AppError,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  PRODUCT_STATUS,
  NOTIFICATION_TYPE,
  sendEmail,
  getPagination,
  getPaginationMeta,
} from '../utils/index.js';
import { emailTemplates } from './emailTemplatesService.js';
import { validateCoupon } from './couponService.js';

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

  const orderItems = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = await productRepository.findById(item.product);
    if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError('Product not found', 404);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.title}`, 400);
    }
    const price = product.discountPrice || product.price;

    const orderItem = {
      product: item.product,
      quantity: item.quantity,
      price,
    };

    const variant =
      typeof item.variant?.toObject === 'function'
        ? item.variant.toObject()
        : item.variant;
    if (
      variant &&
      typeof variant === 'object' &&
      Object.values(variant).some(value => value != null)
    ) {
      orderItem.variant = variant;
    }

    orderItems.push(orderItem);

    subtotal += price * item.quantity;
  }

  let discount = 0;
  let coupon = null;
  if (data.couponCode) {
    const { coupon: foundCoupon, discount: couponDiscount } =
      await validateCoupon(data.couponCode, subtotal);
    coupon = foundCoupon;
    discount = couponDiscount;
  }

  const total = subtotal - discount;

  for (const item of orderItems) {
    await productRepository.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity },
    });
  }

  if (coupon) {
    await couponRepository.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1 },
    });
  }

  const order = await orderRepository.create({
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

  await cartRepository.findByIdAndUpdate(cart._id, { items: [], total: 0 });

  await notificationRepository.create({
    title: 'New Order Placed',
    message: `Order ${order.orderNumber} has been placed successfully`,
    type: NOTIFICATION_TYPE.ORDER,
    user: userId,
  });

  try {
    const populatedOrder = await orderRepository.findByOrderNumber(
      order.orderNumber,
    );
    await sendEmail({
      to: populatedOrder.user.email,
      ...emailTemplates.orderConfirmation(populatedOrder),
    });
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
  }

  return await orderRepository.findByOrderNumber(order.orderNumber);
};

export const getOrders = async (query, userId = null) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (userId) {
    filter.user = userId;
  }
  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }
  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  const orders = await orderRepository.find(filter, {
    skip,
    limit,
    sort: { createdAt: -1 },
    populate: ['user', 'items.product'],
  });
  const total = await orderRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { orders, meta };
};

export const getOrderById = async (id, userId = null) => {
  const filter = { _id: id };
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

  const upperStatus = orderStatus
    ? orderStatus.toUpperCase().trim()
    : order.orderStatus;

  if (
    upperStatus === ORDER_STATUS.CANCELLED &&
    order.orderStatus !== ORDER_STATUS.CANCELLED
  ) {
    for (const item of order.items) {
      await productRepository.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
  }

  const updatedOrder = await orderRepository.findByIdAndUpdate(
    id,
    { orderStatus: upperStatus },
    { new: true },
  );

  await notificationRepository.create({
    title: 'Order Status Updated',
    message: `Order ${updatedOrder.orderNumber} status changed to ${upperStatus}`,
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

  const upperPayStatus = paymentStatus
    ? paymentStatus.toUpperCase().trim()
    : order.paymentStatus;

  const updatedOrder = await orderRepository.findByIdAndUpdate(
    id,
    { paymentStatus: upperPayStatus },
    { new: true },
  );

  return await orderRepository.findByOrderNumber(updatedOrder.orderNumber);
};

export const cancelOrder = async (orderId, userId) => {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.user.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to cancel this order', 403);
  }

  const currentStatus = order.orderStatus
    ? order.orderStatus.toUpperCase().trim()
    : '';

  if (currentStatus !== 'PENDING' && currentStatus !== 'PROCESSING') {
    throw new AppError('Order cannot be cancelled at this stage', 400);
  }

  const updatedOrder = await orderRepository.findByIdAndUpdate(
    orderId,
    { orderStatus: 'CANCELLED' },
    { new: true },
  );

  for (const item of order.items) {
    await productRepository.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity, sold: -item.quantity },
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