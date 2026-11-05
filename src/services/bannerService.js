import { bannerRepository } from '../repositories/index.js';
import { AppError } from '../utils/index.js';

export const createBanner = async (data) => {
  return await bannerRepository.create(data);
};

export const getBanners = async (includeInactive = false, filter = {}) => {
  const query = { ...filter };

  if (!includeInactive) {
    query.active = true;
  }

  return await bannerRepository.find(query, {
    sort: { order: 1, createdAt: -1 },
  });
};

export const getAllBannersAdmin = async (filter = {}) => {
  return await bannerRepository.find(filter, {
    sort: { order: 1, createdAt: -1 },
  });
};

export const getBannerById = async (id) => {
  const banner = await bannerRepository.findById(id);
  if (!banner) {
    throw new AppError('Banner not found', 404);
  }
  return banner;
};

export const updateBanner = async (id, data) => {
  const banner = await bannerRepository.findByIdAndUpdate(id, data, {
    new: true,
  });
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
