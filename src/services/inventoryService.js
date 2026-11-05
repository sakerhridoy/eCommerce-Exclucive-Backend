import {
  productRepository,
  orderRepository,
  notificationRepository,
} from '../repositories/index.js';
import {
  AppError,
  PRODUCT_STATUS,
  NOTIFICATION_TYPE,
  sendAdminAlert,
} from '../utils/index.js';
import { emailTemplates } from './emailTemplatesService.js';

// Stock at or below this level triggers a "low stock" alert.
export const LOW_STOCK_THRESHOLD = 10;

// Return stock for a set of order items (used for rollbacks & cancellations).
const releaseItems = async items => {
  for (const item of items) {
    await productRepository.findOneAndUpdate(
      { _id: item.product },
      { $inc: { stock: item.quantity, sold: -item.quantity } },
    );
  }
};

// Raise a single unread low/out-of-stock alert per product.
const notifyLowStock = async product => {
  try {
    if (!product || product.stock > LOW_STOCK_THRESHOLD) return;

    const existing = await notificationRepository.findOne({
      type: NOTIFICATION_TYPE.LOW_STOCK,
      productId: product._id,
      read: false,
    });
    if (existing) return;

    const isOutOfStock = product.stock <= 0;
    await notificationRepository.create({
      title: isOutOfStock ? 'Out of Stock Alert' : 'Low Stock Alert',
      message: isOutOfStock
        ? `"${product.title}" is out of stock.`
        : `"${product.title}" is running low — only ${product.stock} left.`,
      type: NOTIFICATION_TYPE.LOW_STOCK,
      productId: product._id,
    });

    // Email the store owner (fires once per product until the alert is read).
    await sendAdminAlert(emailTemplates.adminLowStock(product));
  } catch (error) {
    // Never let an alert failure break the checkout flow.
    console.error('Failed to create low stock alert:', error);
  }
};

/**
 * Atomically reserve (deduct) stock for the given order items.
 *
 * The conditional `stock: { $gte: quantity }` filter makes each update a
 * single atomic document operation, so concurrent checkouts for the last
 * unit can never oversell — the loser simply fails the match.
 * If any item cannot be fulfilled, every earlier reservation in this call
 * is rolled back before throwing.
 */
export const reserveStock = async items => {
  const reserved = [];

  try {
    for (const item of items) {
      const updated = await productRepository.findOneAndUpdate(
        {
          _id: item.product,
          status: PRODUCT_STATUS.ACTIVE,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity, sold: item.quantity } },
        { new: true },
      );

      if (!updated) {
        throw new AppError(
          'Sorry, one of the items just went out of stock. Please review your cart.',
          409,
        );
      }

      reserved.push(item);
      await notifyLowStock(updated);
    }
  } catch (error) {
    if (reserved.length) await releaseItems(reserved);
    throw error;
  }

  return reserved;
};

// Undo a reservation without touching the order (e.g. order save failed).
export const releaseStockItems = async items => {
  if (!items || items.length === 0) return;
  await releaseItems(items);
};

/**
 * Idempotently restore stock for a cancelled / failed order.
 *
 * The `inventoryRestored: { $ne: true }` filter acts as an atomic claim, so
 * even if cancel/fail paths run concurrently the stock is returned exactly
 * once. Returns true only for the caller that performed the restore.
 */
export const restoreStockForOrder = async order => {
  if (!order || !order._id) return false;

  const claimed = await orderRepository.findOneAndUpdate(
    { _id: order._id, inventoryRestored: { $ne: true } },
    { inventoryRestored: true },
    { new: true },
  );

  if (!claimed) return false;

  await releaseItems(order.items || []);
  return true;
};