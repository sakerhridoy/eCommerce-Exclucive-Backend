import { asyncHandler, sendResponse } from '../utils/index.js';
import * as websiteSettingsService from '../services/websiteSettingsService.js';

export const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await websiteSettingsService.getWebsiteSettings();

  sendResponse(res, {
    message: 'Site settings fetched successfully',
    data: settings,
  });
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
  const settings = await websiteSettingsService.updateWebsiteSettings(req.body);

  sendResponse(res, {
    message: 'Site settings updated successfully',
    data: settings,
  });
});
