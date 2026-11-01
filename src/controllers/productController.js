import { asyncHandler, sendResponse } from '../utils/index.js';
import * as productService from '../services/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';

export const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };

  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (uploadResult) {
      productData.image = uploadResult.secure_url;
      productData.thumbnail = uploadResult.secure_url;
    }
  }

  const product = await productService.createProduct(productData);
  sendResponse(res, {
    message: 'Product created successfully',
    data: product,
    statusCode: 201,
  });
});

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);
  sendResponse(res, {
    data: result.products,
    meta: result.meta,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  sendResponse(res, { data: product });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  sendResponse(res, { data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };

  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (uploadResult) {
      updateData.image = uploadResult.secure_url;
      updateData.thumbnail = uploadResult.secure_url;
    }
  }

  const product = await productService.updateProduct(req.params.id, updateData);
  sendResponse(res, {
    message: 'Product updated successfully',
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);
  sendResponse(res, {
    message: 'Product deleted successfully',
    data: product,
  });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getFeaturedProducts();

  sendResponse(res, {
    data: products,
  });
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const products = await productService.getBestSellers();

  sendResponse(res, {
    data: products,
  });
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const products = await productService.getNewArrivals();

  sendResponse(res, {
    data: products,
  });
});

export const getDiscountProducts = asyncHandler(async (req, res) => {
  const products = await productService.getDiscountProducts();

  sendResponse(res, {
    data: products,
  });
});