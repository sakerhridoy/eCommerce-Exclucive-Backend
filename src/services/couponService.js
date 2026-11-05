import { couponRepository, orderRepository } from '../repositories/index.js';
import {
  AppError,
  DISCOUNT_TYPE,
  getPagination,
  getPaginationMeta,
} from '../utils/index.js';

export const createCoupon = async data => {
  const existingCoupon = await couponRepository.findByCode(
    data.code.toUpperCase(),
  );
  if (existingCoupon) {
    throw new AppError('Coupon with this code already exists', 400);
  }

  if (new Date(data.expiryDate) < new Date()) {
    throw new AppError('Expiry date must be in the future', 400);
  }

  return await couponRepository.create({
    ...data,
    code: data.code.toUpperCase(),
  });
};

export const getCoupons = async query => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  if (query.active !== undefined) {
    filter.active = query.active === 'true';
  }

  const coupons = await couponRepository.find(filter, {
    skip,
    limit,
    sort: { createdAt: -1 },
  });
  const total = await couponRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return { coupons, meta };
};

export const getCouponById = async id => {
  const coupon = await couponRepository.findById(id);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

export const updateCoupon = async (id, data) => {
  if (data.code) {
    data.code = data.code.toUpperCase();
    const existingCoupon = await couponRepository.findOne({
      code: data.code,
      _id: { $ne: id },
    });
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

export const deleteCoupon = async id => {
  const coupon = await couponRepository.findByIdAndDelete(id);
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }
  return coupon;
};

export const validateCoupon = async (
  code,
  subtotal,
  cartItems = [],
  userId = null,
) => {
  const coupon = await couponRepository.findByCode(code.toUpperCase());

  // 1. Basic Validations
  if (!coupon) throw new AppError('Invalid coupon code', 400);
  if (!coupon.active)
    throw new AppError('This coupon is currently inactive', 400);
  if (new Date(coupon.expiryDate) < new Date())
    throw new AppError('Coupon has expired', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Coupon global usage limit exceeded', 400);
  }

  // 2. Customer Specific Validations (Requires Authentication)
  if (coupon.isFirstOrderOnly || coupon.perCustomerLimit) {
    if (!userId) {
      throw new AppError('You must be logged in to apply this coupon', 401);
    }

    // Check First Order
    if (coupon.isFirstOrderOnly) {
      const userOrderCount = await orderRepository.countDocuments({
        user: userId,
      });
      if (userOrderCount > 0) {
        throw new AppError(
          'This coupon is only valid for first-time orders',
          400,
        );
      }
    }

    // Check Per Customer Limit
    if (coupon.perCustomerLimit) {
      // Counts how many successful/processing orders this user has with this coupon
      const userCouponUsageCount = await orderRepository.countDocuments({
        user: userId,
        couponCode: coupon.code,
        paymentStatus: { $ne: 'FAILED' }, // Assuming failed payments don't consume coupons
      });

      if (userCouponUsageCount >= coupon.perCustomerLimit) {
        throw new AppError(
          `You have already used this coupon ${coupon.perCustomerLimit} time(s)`,
          400,
        );
      }
    }
  }

  // 3. Applicable Products & Categories Validation
  let eligibleSubtotal = subtotal;

  if (
    (coupon.applicableProducts && coupon.applicableProducts.length > 0) ||
    (coupon.applicableCategories && coupon.applicableCategories.length > 0)
  ) {
    if (!cartItems || cartItems.length === 0) {
      throw new AppError(
        'Cart items are required to validate specific coupon rules',
        400,
      );
    }

    eligibleSubtotal = 0;
    const appProductsStr = coupon.applicableProducts.map(p => p.toString());
    const appCategoriesStr = coupon.applicableCategories.map(c => c.toString());

    cartItems.forEach(item => {
      // Handle populated product object vs plain string ID
      const productId = item.product._id
        ? item.product._id.toString()
        : item.product.toString();
      const categoryId = item.product.category
        ? item.product.category.toString()
        : null;

      let isEligible = false;
      if (appProductsStr.length > 0 && appProductsStr.includes(productId)) {
        isEligible = true;
      } else if (
        appCategoriesStr.length > 0 &&
        categoryId &&
        appCategoriesStr.includes(categoryId)
      ) {
        isEligible = true;
      }

      if (isEligible) {
        // Calculate subtotal only for eligible items
        eligibleSubtotal += item.price * item.quantity;
      }
    });

    if (eligibleSubtotal === 0) {
      throw new AppError(
        'This coupon is not applicable to any products in your cart',
        400,
      );
    }
  }

  // 4. Minimum Purchase Check (Based on eligible items)
  if (eligibleSubtotal < coupon.minimumPurchase) {
    throw new AppError(
      `Minimum eligible purchase amount is BDT ${coupon.minimumPurchase.toFixed(2)}`,
      400,
    );
  }

  // 5. Discount Calculation
  let discount = 0;
  if (coupon.discountType === DISCOUNT_TYPE.PERCENTAGE) {
    discount = (eligibleSubtotal * coupon.discountValue) / 100;

    // Apply Max Discount Limit if exists
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else {
    discount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed the eligible subtotal
  discount = Math.min(discount, eligibleSubtotal);

  return { coupon, discount };
};