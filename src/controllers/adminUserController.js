import { asyncHandler, sendResponse } from '../utils/index.js';
import * as adminUserService from '../services/index.js';

export const getStaff = asyncHandler(async (req, res) => {
  const staff = await adminUserService.listStaff();
  sendResponse(res, { data: staff });
});

export const createStaff = asyncHandler(async (req, res) => {
  const staff = await adminUserService.createStaff(req.body);
  sendResponse(res, {
    message: 'Staff member created successfully',
    data: staff,
    statusCode: 201,
  });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await adminUserService.updateStaff(
    req.user._id,
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    message: 'Staff member updated successfully',
    data: staff,
  });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await adminUserService.deleteStaff(req.user._id, req.params.id);
  sendResponse(res, {
    message: 'Staff member deleted successfully',
    data: staff,
  });
});
