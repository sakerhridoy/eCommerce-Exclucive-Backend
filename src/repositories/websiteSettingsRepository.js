import { WebsiteSettings } from '../models/index.js';
import { BaseRepository } from './baseRepository.js';

class WebsiteSettingsRepository extends BaseRepository {
  constructor() {
    super(WebsiteSettings);
  }
}

export const websiteSettingsRepository = new WebsiteSettingsRepository();
