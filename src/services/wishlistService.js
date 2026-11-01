import { wishlistRepository, productRepository } from '../repositories/index.js';
import { AppError } from '../utils/index.js';

export const getWishlist = async (userId) => {
  let wishlist = await wishlistRepository.findByUser(userId);
  if (!wishlist) {
    wishlist = await wishlistRepository.create({ user: userId, products: [] });
  }
  return wishlist;
};

export const addToWishlist = async (userId, productId) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  let wishlist = await wishlistRepository.findByUser(userId);
  if (!wishlist) {
    wishlist = await wishlistRepository.create({ user: userId, products: [] });
  }

  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  await wishlist.populate('products');
  return wishlist;
};

export const removeFromWishlist = async (userId, productId) => {
  const wishlist = await wishlistRepository.findByUser(userId);
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
  await wishlist.save();
  await wishlist.populate('products');

  return wishlist;
};

export const clearWishlist = async (userId) => {
  const wishlist = await wishlistRepository.findByUser(userId);
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }

  wishlist.products = [];
  await wishlist.save();

  return wishlist;
};
