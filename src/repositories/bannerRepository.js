import { Banner } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class BannerRepository extends BaseRepository {
  constructor() {
    super(Banner);
  }

  async findAllActive(options = {}) {
    return await this.find({ active: true }, options);
  }
}

export const bannerRepository = new BannerRepository();
