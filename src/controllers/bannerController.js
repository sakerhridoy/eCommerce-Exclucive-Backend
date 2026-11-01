import { asyncHandler, sendResponse } from '../utils/index.js';
import * as bannerService from '../services/index.js';
import { ROLES } from '../utils/index.js';

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  sendResponse(res, {
    message: 'Banner created successfully',
    data: banner,
    statusCode: 201
  });
});

export const getBanners = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === ROLES.ADMIN;
  const banners = await bannerService.getBanners(includeInactive);
  sendResponse(res, { data: banners });
});

export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await bannerService.getBannerById(req.params.id);
  sendResponse(res, { data: banner });
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  sendResponse(res, {
    message: 'Banner updated successfully',
    data: banner
  });
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.deleteBanner(req.params.id);
  sendResponse(res, {
    message: 'Banner deleted successfully',
    data: banner
  });
});
