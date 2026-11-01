import { asyncHandler, sendResponse } from '../utils/index.js';
import * as cartService from '../services/index.js';

export const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  sendResponse(res, { data: cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, variant } = req.body;
  const cart = await cartService.addToCart(req.user._id, productId, quantity, variant);
  sendResponse(res, {
    message: 'Item added to cart',
    data: cart
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await cartService.updateCartItem(req.user._id, req.params.itemId, quantity);
  sendResponse(res, {
    message: 'Cart item updated',
    data: cart
  });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await cartService.removeFromCart(req.user._id, req.params.itemId);
  sendResponse(res, {
    message: 'Item removed from cart',
    data: cart
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user._id);
  sendResponse(res, {
    message: 'Cart cleared',
    data: cart
  });
});
