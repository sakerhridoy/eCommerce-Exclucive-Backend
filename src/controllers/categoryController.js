import { asyncHandler, sendResponse } from '../utils/index.js';
import * as categoryService from '../services/index.js';

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendResponse(res, {
    message: 'Category created successfully',
    data: category,
    statusCode: 201
  });
});

export const getCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories(req.query);
  sendResponse(res, {
    data: result.categories,
    meta: result.meta
  });
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  sendResponse(res, { data: category });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendResponse(res, { data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendResponse(res, {
    message: 'Category updated successfully',
    data: category
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.deleteCategory(req.params.id);
  sendResponse(res, {
    message: 'Category deleted successfully',
    data: category
  });
});
