import mongoose from 'mongoose';
import {
  reviewRepository,
  productRepository,
  orderRepository,
  notificationRepository,
} from '../repositories/index.js';
import {
  AppError,
  REVIEW_STATUS,
  ORDER_STATUS,
  NOTIFICATION_TYPE,
  getPagination,
  getPaginationMeta,
  deleteFromCloudinary,
} from '../utils/index.js';

const toObjectId = id => new mongoose.Types.ObjectId(id);

// A customer may review a product once they have any non-cancelled order for it.
const hasPurchasedProduct = async (userId, productId) => {
  const order = await orderRepository.findOne({
    user: userId,
    orderStatus: { $ne: ORDER_STATUS.CANCELLED },
    'items.product': productId,
  });
  return Boolean(order);
};

// The "Verified Purchase" badge is reserved for delivered orders.
const hasDeliveredProduct = async (userId, productId) => {
  const order = await orderRepository.findOne({
    user: userId,
    orderStatus: ORDER_STATUS.DELIVERED,
    'items.product': productId,
  });
  return Boolean(order);
};

const buildRatingSummary = async productId => {
  const rows = await reviewRepository.aggregate([
    {
      $match: {
        product: toObjectId(productId),
        status: REVIEW_STATUS.APPROVED,
      },
    },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;

  rows.forEach(row => {
    const stars = Number(row._id);
    if (!breakdown[stars] && breakdown[stars] !== 0) return;
    breakdown[stars] = row.count;
    total += row.count;
    sum += stars * row.count;
  });

  return {
    average: total ? Math.round((sum / total) * 10) / 10 : 0,
    total,
    breakdown,
  };
};

/**
 * Recompute a product's cached `rating` and `reviewCount` from its approved
 * reviews. Called whenever a review is approved, rejected or deleted so the
 * aggregate stays in sync with moderation decisions.
 */
export const recalculateProductRating = async productId => {
  const summary = await buildRatingSummary(productId);
  await productRepository.findByIdAndUpdate(productId, {
    rating: summary.average,
    reviewCount: summary.total,
  });
  return { rating: summary.average, reviewCount: summary.total };
};

const notifyNewReview = async review => {
  try {
    const product = await productRepository.findById(review.product);
    await notificationRepository.create({
      title: 'New Review Submitted',
      message: `A new ${review.rating}-star review is awaiting moderation for "${product?.title || 'a product'}".`,
      type: NOTIFICATION_TYPE.REVIEW,
      productId: review.product,
    });
  } catch {
    // A failed alert must never break the customer's review submission.
  }
};

export const createReview = async (userId, data, images = []) => {
  const product = await productRepository.findById(data.productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const purchased = await hasPurchasedProduct(userId, data.productId);
  if (!purchased) {
    throw new AppError(
      'You can only review products you have purchased.',
      403,
    );
  }

  const existingReview = await reviewRepository.findOne({
    user: userId,
    product: data.productId,
  });
  if (existingReview) {
    throw new AppError('You have already reviewed this product.', 400);
  }

  const verifiedPurchase = await hasDeliveredProduct(userId, data.productId);

  const review = await reviewRepository.create({
    user: userId,
    product: data.productId,
    rating: data.rating,
    title: data.title || undefined,
    comment: data.comment || '',
    images,
    verifiedPurchase,
    status: REVIEW_STATUS.PENDING,
  });

  await notifyNewReview(review);

  return review;
};

export const getProductReviews = async (productId, query = {}) => {
  const { page, limit, skip } = getPagination(query);

  const filter = { product: productId, status: REVIEW_STATUS.APPROVED };
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total, summary] = await Promise.all([
    reviewRepository.find(filter, {
      skip,
      limit,
      sort: { createdAt: -1 },
      populate: [{ path: 'user', select: 'name' }],
    }),
    reviewRepository.countDocuments(filter),
    buildRatingSummary(productId),
  ]);

  return { reviews, summary, meta: getPaginationMeta(total, page, limit) };
};

export const getAllReviews = async (query = {}) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }
  if (query.product) {
    filter.product = query.product;
  }
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, total] = await Promise.all([
    reviewRepository.find(filter, {
      skip,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'product', select: 'title images image' },
      ],
    }),
    reviewRepository.countDocuments(filter),
  ]);

  return { reviews, meta: getPaginationMeta(total, page, limit) };
};

// Public: top-rated approved reviews used on the About page and home page
// testimonial sections.
export const getFeaturedReviews = async (query = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 8, 1), 20);
  const minRating = Math.min(Math.max(Number(query.minRating) || 4, 1), 5);

  const reviews = await reviewRepository.find(
    {
      status: REVIEW_STATUS.APPROVED,
      rating: { $gte: minRating },
      comment: { $nin: [null, ''] },
    },
    {
      limit,
      sort: { rating: -1, createdAt: -1 },
      populate: [
        { path: 'user', select: 'name' },
        { path: 'product', select: 'title images image' },
      ],
    },
  );

  return { reviews };
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

export const moderateReview = async (id, status) => {
  if (!Object.values(REVIEW_STATUS).includes(status)) {
    throw new AppError('Invalid review status', 400);
  }

  const review = await reviewRepository.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await recalculateProductRating(review.product);
  return review;
};

export const deleteReview = async (id, userId, isAdmin) => {
  const review = await reviewRepository.findById(id);
  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (!isAdmin && review.user.toString() !== userId?.toString()) {
    throw new AppError('You are not authorized to delete this review', 403);
  }

  const publicIds = (review.images || [])
    .map(image => image.publicId)
    .filter(Boolean);

  await reviewRepository.findByIdAndDelete(id);
  await recalculateProductRating(review.product);

  await Promise.all(
    publicIds.map(async publicId => {
      try {
        await deleteFromCloudinary(publicId);
      } catch (error) {
        console.error('Failed to delete review image from Cloudinary:', error);
      }
    }),
  );

  return review;
};

export const getMyReviewData = async userId => {
  const [deliveredOrders, pastReviews] = await Promise.all([
    orderRepository.find(
      { user: userId, orderStatus: ORDER_STATUS.DELIVERED },
      { populate: ['items.product'] },
    ),
    reviewRepository.find(
      { user: userId },
      { sort: { createdAt: -1 }, populate: ['product'] },
    ),
  ]);

  const reviewedProductIds = pastReviews
    .map(review => (review.product?._id || review.product)?.toString())
    .filter(Boolean);

  const pendingMap = new Map();

  deliveredOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const product = item.product;
      const productId = product?._id?.toString();
      if (!productId) return;
      if (reviewedProductIds.includes(productId) || pendingMap.has(productId)) {
        return;
      }

      pendingMap.set(productId, {
        _id: product._id,
        name: product.title || product.name,
        image:
          product.images?.[0]?.url ||
          product.images?.[0] ||
          product.image ||
          '',
        purchasedDate: order.createdAt,
      });
    });
  });

  const history = pastReviews.map(review => ({
    _id: review._id,
    productId: review.product?._id,
    productName:
      review.product?.title || review.product?.name || 'Unknown Product',
    image:
      review.product?.images?.[0]?.url ||
      review.product?.images?.[0] ||
      review.product?.image ||
      '',
    rating: review.rating,
    title: review.title || '',
    reviewText: review.comment || '',
    status: review.status,
    verifiedPurchase: review.verifiedPurchase,
    images: review.images || [],
    date: review.createdAt,
  }));

  return { pending: Array.from(pendingMap.values()), history };
};
