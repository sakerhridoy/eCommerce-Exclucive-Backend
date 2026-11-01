import { asyncHandler, sendResponse } from '../utils/index.js';
import * as reviewService from '../services/index.js';
import { ROLES } from '../utils/index.js';

import { Review, Product, Order } from '../models/index.js';

export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const userId = req.user._id || req.user.id;

    const alreadyReviewed = await Review.findOne({
      user: userId,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      rating: Number(rating),
      comment: comment || '',
    });

    const product = await Product.findById(productId);

    if (product) {
      if (!product.reviews) {
        product.reviews = [];
      }

      product.reviews.push(review._id);
      product.numReviews = product.reviews.length;

      const allReviews = await Review.find({ product: productId });
      if (allReviews.length > 0) {
        product.rating =
          allReviews.reduce((acc, item) => item.rating + acc, 0) /
          allReviews.length;
      } else {
        product.rating = Number(rating);
      }

      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    console.error('Review Submit Error: ', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit review',
    });
  }
};

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate('user', 'name email')
    .populate('product', 'name images image')
    .sort({ createdAt: -1 });

  sendResponse(res, {
    message: 'Reviews fetched successfully',
    data: reviews,
    meta: {
      total: reviews.length,
      page: 1,
      limit: reviews.length,
    },
  });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.params.id);
  sendResponse(res, { data: review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === ROLES.ADMIN;
  const review = await reviewService.deleteReview(
    req.params.id,
    req.user._id,
    isAdmin,
  );
  sendResponse(res, {
    message: 'Review deleted successfully',
    data: review,
  });
});

export const getMyReviewData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const pastReviews = await Review.find({ user: userId }).populate(
      'product',
      'name images image',
    );

    const history = pastReviews
      .filter(review => review.product)
      .map(review => ({
        _id: review._id,
        productId: review.product._id,
        productName: review.product.name,
        image:
          review.product.images?.[0]?.url ||
          review.product.image ||
          'https://via.placeholder.com/100',
        rating: review.rating,
        reviewText: review.comment,
        date: review.createdAt
          ? review.createdAt.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      }));

    const reviewedProductIds = history.map(r => r.productId.toString());

    const deliveredOrders = await Order.find({
      user: userId,
      orderStatus: { $regex: /^delivered$/i },
    }).populate('items.product', 'name images image');

    const pendingMap = new Map();

    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        const prod = item.product;
        if (
          prod &&
          !reviewedProductIds.includes(prod._id.toString()) &&
          !pendingMap.has(prod._id.toString())
        ) {
          pendingMap.set(prod._id.toString(), {
            _id: prod._id,
            name: prod.name,
            image:
              prod.images?.[0]?.url ||
              prod.image ||
              'https://via.placeholder.com/100',
            purchasedDate: order.createdAt,
          });
        }
      });
    });

    const pending = Array.from(pendingMap.values());

    res.status(200).json({
      success: true,
      data: { pending, history },
    });
  } catch (error) {
    console.error('Review Fetch Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review data',
      error: error.message,
    });
  }
};