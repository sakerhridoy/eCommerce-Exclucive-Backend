import { User } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.findOne({ email: email.trim().toLowerCase() });
  }
}

export const userRepository = new UserRepository();
