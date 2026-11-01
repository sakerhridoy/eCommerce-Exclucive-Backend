import { asyncHandler, sendResponse } from '../utils/index.js';
import * as couponService from '../services/index.js';

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  sendResponse(res, {
    message: 'Coupon created successfully',
    data: coupon,
    statusCode: 201
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  const result = await couponService.getCoupons(req.query);
  sendResponse(res, {
    data: result.coupons,
    meta: result.meta
  });
});

export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);
  sendResponse(res, { data: coupon });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  sendResponse(res, {
    message: 'Coupon updated successfully',
    data: coupon
  });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.deleteCoupon(req.params.id);
  sendResponse(res, {
    message: 'Coupon deleted successfully',
    data: coupon
  });
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.validateCoupon(req.body.code, req.body.subtotal);
  sendResponse(res, { data: result });
});
