import { Cart } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart);
  }

  async findByUser(userId) {
    return await this.findOne({ user: userId }, { populate: 'items.product' });
  }
}

export const cartRepository = new CartRepository();
