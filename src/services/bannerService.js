import { bannerRepository } from '../repositories/index.js';
import { AppError } from '../utils/index.js';

export const createBanner = async (data) => {
  return await bannerRepository.create(data);
};

export const getBanners = async (includeInactive = false) => {
  if (includeInactive) {
    return await bannerRepository.find({}, { sort: { createdAt: -1 } });
  }
  return await bannerRepository.findAllActive();
};

export const getBannerById = async (id) => {
  const banner = await bannerRepository.findById(id);
  if (!banner) {
    throw new AppError('Banner not found', 404);
  }
  return banner;
};

export const updateBanner = async (id, data) => {
  const banner = await bannerRepository.findByIdAndUpdate(id, data);
  if (!banner) {
    throw new AppError('Banner not found', 404);
  }
  return banner;
};

export const deleteBanner = async (id) => {
  const banner = await bannerRepository.findByIdAndDelete(id);
  if (!banner) {
    throw new AppError('Banner not found', 404);
  }
  return banner;
};
