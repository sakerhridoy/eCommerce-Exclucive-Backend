import {
  userRepository,
  productRepository,
  orderRepository,
  categoryRepository,
  brandRepository,
  couponRepository,
  reviewRepository,
} from '../repositories/index.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PRODUCT_STATUS,
  ROLES,
} from '../utils/index.js';
import { LOW_STOCK_THRESHOLD } from './inventoryService.js';

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    totalCategories,
    totalBrands,
    totalCoupons,
    totalReviews,
    pendingOrders,
    completedOrders,
    revenueResult,
    salesResult,
  ] = await Promise.all([
    userRepository.countDocuments(),
    productRepository.countDocuments(),
    orderRepository.countDocuments(),
    categoryRepository.countDocuments(),
    brandRepository.countDocuments(),
    couponRepository.countDocuments(),
    reviewRepository.countDocuments(),
    orderRepository.countDocuments({ orderStatus: ORDER_STATUS.PENDING }),
    orderRepository.countDocuments({ orderStatus: ORDER_STATUS.DELIVERED }),
    orderRepository.aggregate([
      { $match: { paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    // Total Sales = value of every order that was not cancelled, regardless
    // of whether the payment has been collected yet.
    orderRepository.aggregate([
      { $match: { orderStatus: { $ne: ORDER_STATUS.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const totalSales = salesResult[0]?.total || 0;

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalCategories,
    totalBrands,
    totalCoupons,
    totalReviews,
    pendingOrders,
    completedOrders,
    totalSales,
    totalRevenue,
  };
};

export const getRecentOrders = async (limit = 10) => {
  return await orderRepository.find(
    {},
    {
      limit,
      sort: { createdAt: -1 },
      populate: ['user', 'items.product'],
    },
  );
};

export const getTopSellingProducts = async (limit = 10) => {
  return await productRepository.find(
    {},
    {
      limit,
      sort: { sold: -1 },
      populate: ['category', 'brand'],
    },
  );
};

export const getLowStockProducts = async (limit = 10) => {
  return await productRepository.find(
    { stock: { $lt: 10 } },
    {
      limit,
      sort: { stock: 1 },
      populate: ['category', 'brand'],
    },
  );
};

// Low + out-of-stock products for the admin inventory alert panel.
export const getInventoryAlerts = async (limit = 20) => {
  const notDeleted = { status: { $ne: PRODUCT_STATUS.DELETED } };

  const [lowStock, outOfStock, lowStockCount, outOfStockCount] =
    await Promise.all([
      productRepository.find(
        { ...notDeleted, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } },
        {
          limit,
          sort: { stock: 1 },
          populate: ['category', 'brand'],
        },
      ),
      productRepository.find(
        { ...notDeleted, stock: { $lte: 0 } },
        {
          limit,
          sort: { updatedAt: -1 },
          populate: ['category', 'brand'],
        },
      ),
      productRepository.countDocuments({
        ...notDeleted,
        stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
      }),
      productRepository.countDocuments({ ...notDeleted, stock: { $lte: 0 } }),
    ]);

  return {
    threshold: LOW_STOCK_THRESHOLD,
    lowStock,
    outOfStock,
    lowStockCount,
    outOfStockCount,
  };
};

export const getSalesReport = async () => {
  try {
    const paidOrders = await orderRepository.find(
      { paymentStatus: PAYMENT_STATUS.PAID },
      {
        sort: { createdAt: -1 },
        populate: ['user', 'items.product'],
      },
    );

    return paidOrders;
  } catch (error) {
    // যদি ওপরের নিয়মে কাজ না করে, তবে ডাইরেক্ট Mongoose Order Model ব্যবহার করতে পারেন:
    // const paidOrders = await Order.find({ paymentStatus: 'PAID' }).populate('user').populate('items.product').sort({ createdAt: -1 });

    throw new Error('Failed to fetch sales report: ' + error.message);
  }
};

// ================= CUSTOMER LIST SERVICE =================
export const getCustomersList = async (limit = 100) => {
  return await userRepository.find(
    { role: 'customer' },
    {
      limit,
      sort: { createdAt: -1 },
    },
  );
};
