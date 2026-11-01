import { brandRepository, productRepository } from '../repositories/index.js';
import { AppError, generateSlug } from '../utils/index.js';

export const createBrand = async (data) => {
  const slug = generateSlug(data.name);
  const existingBrand = await brandRepository.findBySlug(slug);
  if (existingBrand) {
    throw new AppError('Brand with this name already exists', 400);
  }

  return await brandRepository.create({ ...data, slug });
};

export const getBrands = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const brands = await brandRepository.find({}, { skip, limit, sort: { createdAt: -1 } });
  const total = await brandRepository.countDocuments();
  const meta = getPaginationMeta(total, page, limit);

  return { brands, meta };
};

export const getBrandById = async (id) => {
  const brand = await brandRepository.findById(id);
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }
  return brand;
};

export const getBrandBySlug = async (slug) => {
  const brand = await brandRepository.findBySlug(slug);
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }
  return brand;
};

export const updateBrand = async (id, data) => {
  if (data.name) {
    data.slug = generateSlug(data.name);
    const existingBrand = await brandRepository.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existingBrand) {
      throw new AppError('Brand with this name already exists', 400);
    }
  }

  const brand = await brandRepository.findByIdAndUpdate(id, data);
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }
  return brand;
};

export const deleteBrand = async (id) => {
  const productsCount = await productRepository.countDocuments({ brand: id });
  if (productsCount > 0) {
    throw new AppError('Cannot delete brand with products', 400);
  }

  const brand = await brandRepository.findByIdAndDelete(id);
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }
  return brand;
};

import { getPagination, getPaginationMeta } from '../utils/index.js';
