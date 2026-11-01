import { couponRepository } from '../repositories/index.js';
import { AppError, DISCOUNT_TYPE } from '../utils/index.js';

export const createCoupon = async (data) => {
  const existingCoupon = await couponRepository.findByCode(data.code);
  if (existingCoupon) {
    throw new AppError('Coupon with this code already exists', 400);
  }

  if (data.expiryDate < new Date()) {
    throw new AppError('Expiry date must be in the future', 400);
  }

  return await couponRepository.create({ ...data, code: data.code.toUpperCase() });
};

export const getCoupons = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.active !== undefined) {
    filter.active = query.active === 'true';
  }

  const coupons = await couponRepository.find(filter, { skip, limit, sort: { createdAt: -1 } });
  const total = await couponRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { coupons, meta };
};

export const getCouponById = async (id) => {
  const coupon = await couponRepository.findById(id);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

export const updateCoupon = async (id, data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
    const existingCoupon = await couponRepository.findOne({ code: data.code, _id: { $ne: id } });
    if (existingCoupon) {
      throw new AppError('Coupon with this code already exists', 400);
    }
  }

  const coupon = await couponRepository.findByIdAndUpdate(id, data);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

export const deleteCoupon = async (id) => {
  const coupon = await couponRepository.findByIdAndDelete(id);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

export const validateCoupon = async (code, subtotal) => {
  const coupon = await couponRepository.findByCode(code);
  if (!coupon) {
    throw new AppError('Invalid coupon code', 400);
  }

  if (coupon.expiryDate < new Date()) {
    throw new AppError('Coupon has expired', 400);
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit exceeded', 400);
  }

  if (subtotal < coupon.minimumPurchase) {
    throw new AppError(`Minimum purchase amount is $${coupon.minimumPurchase.toFixed(2)}`, 400);
  }

  let discount = 0;
  if (coupon.discountType === DISCOUNT_TYPE.PERCENTAGE) {
    discount = (subtotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  return { coupon, discount };
};

import { getPagination, getPaginationMeta } from '../utils/index.js';
