import { Review } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByProduct(productId, options = {}) {
    return await this.find({ product: productId }, { ...options, populate: 'user' });
  }

  async findByUser(userId, options = {}) {
    return await this.find({ user: userId }, { ...options, populate: 'product' });
  }
}

export const reviewRepository = new ReviewRepository();
