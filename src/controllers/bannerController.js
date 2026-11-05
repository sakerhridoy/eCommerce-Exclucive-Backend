import { asyncHandler, sendResponse, AppError, deleteFromCloudinary } from '../utils/index.js';
import { uploadOnCloudinary } from '../utils/constants/cloudinary.js';
import * as bannerService from '../services/index.js';

// Local file -> Cloudinary, return { publicId, url }
const uploadBannerImage = async (file) => {
  if (!file) return null;

  const uploaded = await uploadOnCloudinary(file.path);
  if (!uploaded) return null;

  return { publicId: uploaded.public_id, url: uploaded.secure_url };
};

export const createBanner = asyncHandler(async (req, res) => {
  const image = await uploadBannerImage(req.file);

  if (!image) {
    throw new AppError('Banner image is required', 400);
  }

  const banner = await bannerService.createBanner({ ...req.body, image });
  sendResponse(res, {
    message: 'Banner created successfully',
    data: banner,
    statusCode: 201,
  });
});

export const getBanners = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const banners = await bannerService.getBanners(false, filter);
  sendResponse(res, { data: banners });
});

export const getAllBannersAdmin = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const banners = await bannerService.getAllBannersAdmin(filter);
  sendResponse(res, { data: banners });
});

export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.id);
  sendResponse(res, { data: banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const existing = await bannerService.getBannerById(req.params.id);
  const updateData = { ...req.body };

  const image = await uploadBannerImage(req.file);
  if (image) {
    updateData.image = image;
  }

  const banner = await bannerService.updateBanner(req.params.id, updateData);

  // New image replace hole purono image Cloudinary theke muche fela
  if (image && existing?.image?.publicId) {
    await deleteFromCloudinary(existing.image.publicId);
  }

  sendResponse(res, {
    message: 'Banner updated successfully',
    data: banner,
  });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.deleteBanner(req.params.id);

  if (banner?.image?.publicId) {
    await deleteFromCloudinary(banner.image.publicId);
  }

  sendResponse(res, {
    message: 'Banner deleted successfully',
    data: banner,
  });
});
