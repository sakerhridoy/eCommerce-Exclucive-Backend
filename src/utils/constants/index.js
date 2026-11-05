export * from './rbac.js';

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted'
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const PAYMENT_METHOD = {
  COD: 'cod',
  STRIPE: 'stripe',
  SSLCOMMERZ: 'sslcommerz'
};

export const DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
};

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const NOTIFICATION_TYPE = {
  ORDER: 'order',
  LOW_STOCK: 'low_stock',
  REVIEW: 'review',
  ADMIN: 'admin'
};

export const ACTIVITY_TYPE = {
  ADMIN_LOGIN: 'admin_login',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  ORDER_UPDATE: 'order_update',
  COUPON_UPDATE: 'coupon_update',
  SETTINGS_UPDATE: 'settings_update'
};
