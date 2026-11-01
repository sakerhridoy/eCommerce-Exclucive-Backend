import {
  productRepository,
  categoryRepository,
  brandRepository,
  bannerRepository,
} from '../repositories/index.js';

export const getHomeData = async () => {
  const [
    featured,
    bestSellers,
    newArrivals,
    discountProducts,
    categories,
    brands,
    banners,
  ] = await Promise.all([
    productRepository.findFeatured(),
    productRepository.findBestSellers(),
    productRepository.findNewArrivals(),
    productRepository.findDiscountProducts(),
    categoryRepository.findAllActive(),
    brandRepository.findAllActive(),
    bannerRepository.findAllActive({
      sort: { order: 1 },
    }),
  ]);

  return {
    featured,
    bestSellers,
    newArrivals,
    discountProducts,
    categories,
    brands,
    banners,
  };
};
