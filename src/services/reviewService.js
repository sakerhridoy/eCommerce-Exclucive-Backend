import {
  reviewRepository,
  productRepository,
  orderRepository,
  notificationRepository,
} from '../repositories/index.js';
import {
  AppError,
  NOTIFICATION_TYPE,
  getPagination,
  getPaginationMeta,
  ORDER_STATUS,
} from '../utils/index.js'; // ORDER_STATUS ইমপোর্ট করা হলো

// ================= EXISTING FUNCTIONS =================

export const createReview = async (userId, data) => {
  const product = await productRepository.findById(data.product);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const userOrders = await orderRepository.findByUser(userId);
  const hasPurchased = userOrders.some(order =>
    order.items.some(item => item.product.toString() === data.product),
  );

  if (!hasPurchased) {
    throw new AppError('You can only review products you have purchased', 400);
  }

  const existingReview = await reviewRepository.findOne({
    user: userId,
    product: data.product,
  });
  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  return await reviewRepository.create({ ...data, user: userId });
};

export const getReviews = async query => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.product) {
    filter.product = query.product;
  }
  if (query.user) {
    filter.user = query.user;
  }

  const reviews = await reviewRepository.find(filter, {
    skip,
    limit,
    sort: { createdAt: -1 },
    populate: ['user', 'product'],
  });
  const total = await reviewRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { reviews, meta };
};

export const getReviewById = async id => {
  const review = await reviewRepository.findById(id, {
    populate: ['user', 'product'],
  });
  if (!review) {
    throw new AppError('Review not found', 404);
  }
  return review;
};

export const deleteReview = async (id, userId, isAdmin) => {
  const review = await reviewRepository.findById(id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (!isAdmin && review.user.toString() !== userId) {
    throw new AppError('You are not authorized to delete this review', 403);
  }

  return await reviewRepository.findByIdAndDelete(id);
};

// ================= NEW FEATURE: GET MY REVIEWS (PENDING & HISTORY) =================

export const getMyReviewData = async userId => {
  // ১. ইউজারের সমস্ত "DELIVERED" অর্ডার ফেচ করা (product পপুলেট করে)
  // (যদি ORDER_STATUS অবজেক্টে DELIVERED না থাকে, তবে হার্ডকোড করে 'Delivered' বা 'DELIVERED' লিখে দেবেন)
  const orders = await orderRepository.find(
    { user: userId, orderStatus: ORDER_STATUS?.DELIVERED || 'DELIVERED' },
    { populate: ['items.product'] },
  );

  // ২. ইউজারের দেওয়া আগের সব রিভিউ ফেচ করা
  const pastReviews = await reviewRepository.find(
    { user: userId },
    { sort: { createdAt: -1 }, populate: ['product'] },
  );

  const reviewedProductIds = pastReviews.map(
    r => r.product?._id?.toString() || r.product?.toString(),
  );

  // ৩. Pending প্রোডাক্টগুলো বের করা
  const pendingProductsMap = new Map();

  orders.forEach(order => {
    order.items.forEach(item => {
      const product = item.product;
      // যদি প্রোডাক্ট থাকে এবং আগে রিভিউ দেওয়া না হয়ে থাকে
      if (
        product &&
        product._id &&
        !reviewedProductIds.includes(product._id.toString())
      ) {
        pendingProductsMap.set(product._id.toString(), {
          _id: product._id,
          name: product.name,
          // আপনার প্রোডাক্ট স্কিমায় ইমেজ যেভাবে আছে, সেভাবে বসবে
          image:
            product.images?.[0]?.url ||
            product.images?.[0] ||
            product.image ||
            '',
          purchasedDate: order.createdAt,
        });
      }
    });
  });

  const pending = Array.from(pendingProductsMap.values());

  // ৪. History ডাটা ফরম্যাট করা
  const history = pastReviews.map(review => ({
    _id: review._id,
    productName: review.product?.name || 'Unknown Product',
    image:
      review.product?.images?.[0]?.url ||
      review.product?.images?.[0] ||
      review.product?.image ||
      '',
    rating: review.rating,
    reviewText: review.comment || review.reviewText || '',
    date: review.createdAt,
  }));

  return { pending, history };
};