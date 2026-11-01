import express from 'express';
import * as reviewController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { reviewSchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.get('/', reviewController.getReviews);
router.get(
  '/my-reviews',
  authenticate,
  // authorize(ROLES.CUSTOMER),
  reviewController.getMyReviewData,
);
router.get('/:id', reviewController.getReviewById);

router.post(
  '/',
  authenticate,
  validate(reviewSchema),
  reviewController.createReview,
);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
