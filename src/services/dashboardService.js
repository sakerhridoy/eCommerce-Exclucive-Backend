import {
  userRepository,
  productRepository,
  orderRepository,
  categoryRepository,
  brandRepository,
  couponRepository,
  reviewRepository,
} from '../repositories/index.js';
import { ORDER_STATUS, PAYMENT_STATUS, ROLES } from '../utils/index.js';

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
    totalRevenue,
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
  ]);

  const revenue = totalRevenue[0]?.total || 0;

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
    totalRevenue: revenue,
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
