import { asyncHandler, sendResponse } from '../utils/index.js';
import * as productService from '../services/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';

const isRemoteUrl = value =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim());

const getUploadedImages = req => {
  if (Array.isArray(req.files)) return req.files;
  if (req.files?.images) return req.files.images;
  if (req.files?.image) return req.files.image;
  return req.file ? [req.file] : [];
};

const uploadProductFiles = async files => {
  const urls = [];
  for (const file of Array.isArray(files) ? files : []) {
    const uploaded = await uploadOnCloudinary(file.path);
    if (uploaded?.secure_url) urls.push(uploaded.secure_url);
  }
  return urls;
};

/**
 * Build the final, ordered image list from freshly uploaded files and the
 * `imageMeta` descriptor sent by the admin form. Each meta entry is either
 * `{ url }` (an already stored image that must be kept) or `{ newIndex }`
 * (position within the newly uploaded files). Whichever entry carries
 * `primary: true` becomes the product thumbnail.
 */
const resolveProductImages = async (files, imageMeta) => {
  const uploadedUrls = await uploadProductFiles(files);

  if (!Array.isArray(imageMeta) || imageMeta.length === 0) {
    return { images: uploadedUrls, primary: uploadedUrls[0] };
  }

  const images = [];
  let primary;

  for (const entry of imageMeta) {
    if (!entry || typeof entry !== 'object') continue;

    let url;
    if (typeof entry.newIndex === 'number') {
      url = uploadedUrls[entry.newIndex];
    } else if (isRemoteUrl(entry.url)) {
      url = entry.url.trim();
    }

    if (!url) continue;
    images.push(url);
    if (entry.primary) primary = url;
  }

  return { images, primary: primary || images[0] };
};

const applyProductImages = async (productData, files) => {
  const { imageMeta } = productData;
  delete productData.imageMeta;

  const hasImagePayload = files.length > 0 || Array.isArray(imageMeta);
  if (!hasImagePayload) return;

  const { images, primary } = await resolveProductImages(files, imageMeta);
  productData.images = images;
  productData.thumbnail = primary;
  productData.image = primary;
};

export const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };
  await applyProductImages(productData, getUploadedImages(req));

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

// ================= Admin: paginated / filtered product list =================
export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await productService.getAdminProducts(req.query);
  sendResponse(res, {
    data: result.products,
    meta: result.meta,
  });
});

// ================= Admin: bulk actions =================
export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { ids, ...payload } = req.body;
  const result = await productService.bulkUpdateProducts(ids, payload);
  sendResponse(res, {
    message: `${result.modified} product(s) updated`,
    data: result,
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
  await applyProductImages(updateData, getUploadedImages(req));

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
