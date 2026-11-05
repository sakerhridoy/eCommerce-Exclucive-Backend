import {
  asyncHandler,
  sendResponse,
  PERMISSIONS,
  getPermissionsForRole,
} from '../utils/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';
import * as reviewService from '../services/index.js';

const getUploadedFiles = req => {
  if (Array.isArray(req.files)) return req.files;
  if (req.files?.images) return req.files.images;
  return req.file ? [req.file] : [];
};

// Upload review photos to Cloudinary and persist { publicId, url } descriptors.
const buildReviewImages = async files => {
  const list = Array.isArray(files) ? files : [];
  const uploaded = await Promise.all(
    list.map(file => uploadOnCloudinary(file.path)),
  );

  return uploaded
    .filter(item => item?.secure_url)
    .map(item => ({ publicId: item.public_id, url: item.secure_url }));
};

export const createReview = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const images = await buildReviewImages(getUploadedFiles(req));

  const review = await reviewService.createReview(userId, req.body, images);

  sendResponse(res, {
    message: 'Review submitted successfully. It will appear once approved.',
    data: review,
    statusCode: 201,
  });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { reviews, summary, meta } = await reviewService.getProductReviews(
    req.params.productId,
    req.query,
  );

  sendResponse(res, {
    message: 'Reviews fetched successfully',
    data: { reviews, summary },
    meta,
  });
});

export const getReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.getAllReviews(req.query);

  sendResponse(res, {
    message: 'Reviews fetched successfully',
    data: reviews,
    meta,
  });
});

export const getReviewById = asyncHandler(async (req, res) => {
  const review = await reviewService.getReviewById(req.params.id);
  sendResponse(res, { data: review });
});

export const getTestimonials = asyncHandler(async (req, res) => {
  const { reviews } = await reviewService.getFeaturedReviews(req.query);
  sendResponse(res, {
    message: 'Testimonials fetched successfully',
    data: { reviews },
  });
});

export const getMyReviewData = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const data = await reviewService.getMyReviewData(userId);

  sendResponse(res, {
    message: 'Review data fetched successfully',
    data,
  });
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(
    req.params.id,
    req.body.status,
  );

  sendResponse(res, {
    message: `Review ${req.body.status} successfully`,
    data: review,
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const isModerator = getPermissionsForRole(req.user.role).includes(
    PERMISSIONS.REVIEW_MODERATE,
  );
  const review = await reviewService.deleteReview(
    req.params.id,
    req.user._id,
    isModerator,
  );

  sendResponse(res, {
    message: 'Review deleted successfully',
    data: review,
  });
});
