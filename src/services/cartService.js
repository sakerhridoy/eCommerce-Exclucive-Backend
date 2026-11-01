import { cartRepository, productRepository } from '../repositories/index.js';
import { AppError, PRODUCT_STATUS } from '../utils/index.js';

const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    const price = item.product.discountPrice || item.product.price;
    return total + (price * item.quantity);
  }, 0);
};

export const getCart = async (userId) => {
  let cart = await cartRepository.findByUser(userId);
  if (!cart) {
    cart = await cartRepository.create({ user: userId, items: [], total: 0 });
  }
  return cart;
};

export const addToCart = async (userId, productId, quantity, variant = null) => {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new AppError('Quantity must be a positive integer', 400);
  }

  const product = await productRepository.findById(productId);
  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Product not found', 404);
  }

  let cart = await cartRepository.findByUser(userId);
  if (!cart) {
    cart = await cartRepository.create({ user: userId, items: [], total: 0 });
  }

  const existingItemIndex = cart.items.findIndex(item => 
    item.product.toString() === productId && 
    JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  const requestedQuantity =
    quantity + (existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0);
  if (product.stock < requestedQuantity) {
    throw new AppError('Insufficient stock', 400);
  }

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, variant });
  }

  await cart.save();
  await cart.populate('items.product');
  cart.total = calculateCartTotal(cart.items);
  await cart.save();

  return cart;
};

export const updateCartItem = async (userId, itemId, quantity) => {
  if (!Number.isInteger(quantity)) {
    throw new AppError('Quantity must be an integer', 400);
  }

  const cart = await cartRepository.findByUser(userId);
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Cart item not found', 404);
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await productRepository.findById(cart.items[itemIndex].product);
    if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
      throw new AppError('Product not found', 404);
    }
    if (product.stock < quantity) {
      throw new AppError('Insufficient stock', 400);
    }
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product');
  cart.total = calculateCartTotal(cart.items);
  await cart.save();

  return cart;
};

export const removeFromCart = async (userId, itemId) => {
  const cart = await cartRepository.findByUser(userId);
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) {
    throw new AppError('Cart item not found', 404);
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();
  await cart.populate('items.product');
  cart.total = calculateCartTotal(cart.items);
  await cart.save();

  return cart;
};

export const clearCart = async (userId) => {
  const cart = await cartRepository.findByUser(userId);
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = [];
  cart.total = 0;
  await cart.save();

  return cart;
};
