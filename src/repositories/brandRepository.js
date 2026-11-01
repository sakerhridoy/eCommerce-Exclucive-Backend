import { Brand } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class BrandRepository extends BaseRepository {
  constructor() {
    super(Brand);
  }

  async findBySlug(slug) {
    return await this.findOne({ slug });
  }

  async findAllActive() {
    return await this.find({});
  }
}

export const brandRepository = new BrandRepository();
