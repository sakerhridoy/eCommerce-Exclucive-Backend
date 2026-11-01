import { Product } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';
import { PRODUCT_STATUS } from '../utils/index.js';

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async findBySlug(slug) {
    return await this.findOne({ slug }, { populate: ['category', 'brand'] });
  }

  async findAllActive(options = {}) {
    const query = { status: PRODUCT_STATUS.ACTIVE };
    return await this.find(query, {
      ...options,
      populate: ['category', 'brand'],
    });
  }

  async findFeatured(limit = 8) {
    return await this.find(
      { featured: true, status: PRODUCT_STATUS.ACTIVE },
      {
        limit,
        sort: { createdAt: -1 },
        populate: ['category', 'brand'],
      },
    );
  }

  async findBestSellers(limit = 8) {
    return await this.find(
      { status: PRODUCT_STATUS.ACTIVE },
      {
        limit,
        sort: { sold: -1 },
        populate: ['category', 'brand'],
      },
    );
  }

  async findNewArrivals(limit = 8) {
    return await this.find(
      { status: PRODUCT_STATUS.ACTIVE },
      {
        limit,
        sort: { createdAt: -1 },
        populate: ['category', 'brand'],
      },
    );
  }

  async findDiscountProducts(limit = 8) {
    return await this.find(
      {
        status: PRODUCT_STATUS.ACTIVE,
        discountPrice: { $gt: 0 },
      },
      {
        limit,
        sort: { createdAt: -1 },
        populate: ['category', 'brand'],
      },
    );
  }
}

export const productRepository = new ProductRepository();
