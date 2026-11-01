import { asyncHandler, sendResponse } from '../utils/index.js';
import * as homeService from '../services/homeService.js';

export const getHome = asyncHandler(async (req, res) => {
  const data = await homeService.getHomeData();

  sendResponse(res, {
    data,
  });
});
