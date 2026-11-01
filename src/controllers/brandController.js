import { asyncHandler, sendResponse } from '../utils/index.js';
import * as brandService from '../services/index.js';

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  sendResponse(res, {
    message: 'Brand created successfully',
    data: brand,
    statusCode: 201
  });
});

export const getBrands = asyncHandler(async (req, res) => {
  const result = await brandService.getBrands(req.query);
  sendResponse(res, {
    data: result.brands,
    meta: result.meta
  });
});

export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id);
  sendResponse(res, { data: brand });
});

export const getBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandBySlug(req.params.slug);
  sendResponse(res, { data: brand });
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  sendResponse(res, {
    message: 'Brand updated successfully',
    data: brand
  });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.deleteBrand(req.params.id);
  sendResponse(res, {
    message: 'Brand deleted successfully',
    data: brand
  });
});
