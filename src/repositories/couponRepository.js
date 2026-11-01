import { Coupon } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class CouponRepository extends BaseRepository {
  constructor() {
    super(Coupon);
  }

  async findByCode(code) {
    return await this.findOne({ code: code.toUpperCase(), active: true });
  }
}

export const couponRepository = new CouponRepository();
