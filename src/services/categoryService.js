import { categoryRepository, productRepository } from '../repositories/index.js';
import { AppError, generateSlug, PRODUCT_STATUS } from '../utils/index.js';

export const createCategory = async (data) => {
  const slug = generateSlug(data.name);
  const existingCategory = await categoryRepository.findBySlug(slug);
  if (existingCategory) {
    throw new AppError('Category with this name already exists', 400);
  }

  return await categoryRepository.create({ ...data, slug });
};

export const getCategories = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: PRODUCT_STATUS.ACTIVE };

  const categories = await categoryRepository.find(filter, { skip, limit, sort: { createdAt: -1 } });
  const total = await categoryRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { categories, meta };
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category || category.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const getCategoryBySlug = async (slug) => {
  const category = await categoryRepository.findBySlug(slug);
  if (!category || category.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const updateCategory = async (id, data) => {
  if (data.name) {
    data.slug = generateSlug(data.name);
    const existingCategory = await categoryRepository.findOne({ slug: data.slug, _id: { $ne: id } });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }
  }

  const category = await categoryRepository.findByIdAndUpdate(id, data);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const deleteCategory = async (id) => {
  const productsCount = await productRepository.countDocuments({ category: id });
  if (productsCount > 0) {
    throw new AppError('Cannot delete category with products', 400);
  }

  const category = await categoryRepository.findByIdAndDelete(id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

import { getPagination, getPaginationMeta } from '../utils/index.js';
