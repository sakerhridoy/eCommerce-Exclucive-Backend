import { Order } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async findByUser(userId, options = {}) {
    return await this.find({ user: userId }, { ...options, populate: 'items.product' });
  }

  async findByOrderNumber(orderNumber) {
    return await this.findOne({ orderNumber }, { populate: ['user', 'items.product', 'coupon'] });
  }
}

export const orderRepository = new OrderRepository();
