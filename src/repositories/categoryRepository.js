import { Category } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug) {
    return await this.findOne({ slug });
  }

  async findAllActive() {
    return await this.find({});
  }
}

export const categoryRepository = new CategoryRepository();
