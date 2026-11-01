import { Wishlist } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class WishlistRepository extends BaseRepository {
  constructor() {
    super(Wishlist);
  }

  async findByUser(userId) {
    return await this.findOne({ user: userId }, { populate: 'products' });
  }
}

export const wishlistRepository = new WishlistRepository();
