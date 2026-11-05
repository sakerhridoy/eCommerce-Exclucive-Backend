import express from 'express';
import * as reviewController from '../controllers/index.js';
import {
  authenticate,
  requirePermission,
  validate,
  upload,
} from '../middlewares/index.js';
import { reviewSchema, reviewModerationSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

// Customers may attach up to 5 photos to a review.
const reviewImages = upload.array('images', 5);

// Public: approved reviews + rating summary for a single product.
router.get('/product/:productId', reviewController.getProductReviews);

// Public: top-rated approved reviews for the About page / home testimonials.
router.get('/testimonials', reviewController.getTestimonials);

router.get('/my-reviews', authenticate, reviewController.getMyReviewData);

// Admin: moderation queue with status/product/rating filters.
router.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.REVIEW_VIEW),
  reviewController.getReviews,
);

router.get('/:id', reviewController.getReviewById);

router.post(
  '/',
  authenticate,
  reviewImages,
  validate(reviewSchema),
  reviewController.createReview,
);

router.patch(
  '/:id/moderate',
  authenticate,
  requirePermission(PERMISSIONS.REVIEW_MODERATE),
  validate(reviewModerationSchema),
  reviewController.moderateReview,
);

router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
