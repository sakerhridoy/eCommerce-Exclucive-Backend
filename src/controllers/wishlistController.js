import { asyncHandler, sendResponse } from '../utils/index.js';
import * as wishlistService from '../services/index.js';

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.getWishlist(req.user._id);
  sendResponse(res, { data: wishlist });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.addToWishlist(req.user._id, req.body.productId);
  sendResponse(res, {
    message: 'Item added to wishlist',
    data: wishlist
  });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.removeFromWishlist(req.user._id, req.params.productId);
  sendResponse(res, {
    message: 'Item removed from wishlist',
    data: wishlist
  });
});

export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.clearWishlist(req.user._id);
  sendResponse(res, {
    message: 'Wishlist cleared',
    data: wishlist
  });
});
