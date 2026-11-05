import mongoose from 'mongoose';
import {
  productRepository,
  categoryRepository,
  brandRepository,
} from '../repositories/index.js';
import {
  AppError,
  generateSlug,
  PRODUCT_STATUS,
  getPagination,
  getPaginationMeta,
  buildSort,
  escapeRegex,
  buildDateRange,
} from '../utils/index.js';

// Columns admins are allowed to sort the product table by.
const ADMIN_PRODUCT_SORT_FIELDS = [
  'title',
  'price',
  'discountPrice',
  'stock',
  'sold',
  'status',
  'featured',
  'createdAt',
  'updatedAt',
];

const resolveCategory = async categoryInput => {
  if (!categoryInput) return null;

  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    const byId = await categoryRepository.findById(categoryInput);
    if (byId) return byId;
  }

  const slug = generateSlug(String(categoryInput));
  return await categoryRepository.findBySlug(slug);
};

export const createProduct = async data => {
  const slug = generateSlug(data.title);
  const existingProduct = await productRepository.findBySlug(slug);
  if (existingProduct) {
    throw new AppError('Product with this title already exists', 400);
  }

  const category = await resolveCategory(data.category);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (data.brand) {
    const brand = await brandRepository.findById(data.brand);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  return await productRepository.create({
    ...data,
    category: category._id,
    slug,
    status: PRODUCT_STATUS.ACTIVE,
  });
};

export const getProducts = async query => {
  const { page, limit, skip } = getPagination(query);

  const filter = {};

  if (query.category) {
    const categoryDoc = await resolveCategory(query.category);
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      return {
        products: [],
        meta: getPaginationMeta(0, page, limit),
      };
    }
  }

  if (query.brand) {
    filter.brand = query.brand;
  }

  filter.status = PRODUCT_STATUS.ACTIVE;

  if (query.featured !== undefined) {
    filter.featured = query.featured === 'true';
  }

  if (query.search) {
    filter.$or = [
      {
        title: {
          $regex: query.search,
          $options: 'i',
        },
      },
      {
        description: {
          $regex: query.search,
          $options: 'i',
        },
      },
    ];
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};

    if (query.minPrice) {
      filter.price.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  // ==========================
  // SORTING
  // ==========================
  let sort = { createdAt: -1 };

  switch (query.sort) {
    case 'latest':
      sort = { createdAt: -1 };
      break;
    case 'oldest':
      sort = { createdAt: 1 };
      break;
    case 'price_asc':
      sort = { price: 1 };
      break;
    case 'price_desc':
      sort = { price: -1 };
      break;
    case 'name_asc':
      sort = { title: 1 };
      break;
    case 'name_desc':
      sort = { title: -1 };
      break;
    case 'best_selling':
      sort = { sold: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const products = await productRepository.find(filter, {
    skip,
    limit,
    sort,
    populate: ['category', 'brand'],
  });

  const total = await productRepository.countDocuments(filter);
  const meta = getPaginationMeta(total, page, limit);

  return {
    products,
    meta,
  };
};

// ================= ADMIN LISTING & BULK =================
export const getAdminProducts = async query => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};

  const status = String(query.status || '')
    .toUpperCase()
    .trim();
  if (status && status !== 'ALL') {
    filter.status = status.toLowerCase();
  } else {
    // Default: everything except already soft-deleted products.
    filter.status = { $ne: PRODUCT_STATUS.DELETED };
  }

  if (query.category) {
    const categoryDoc = await resolveCategory(query.category);
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      return { products: [], meta: getPaginationMeta(0, page, limit) };
    }
  }

  if (query.brand) {
    filter.brand = query.brand;
  }

  if (query.featured !== undefined && query.featured !== '') {
    filter.featured = query.featured === 'true';
  }

  if (query.stockStatus) {
    const stockStatus = String(query.stockStatus).toUpperCase();
    if (stockStatus === 'OUT') filter.stock = { $lte: 0 };
    else if (stockStatus === 'LOW') filter.stock = { $gt: 0, $lte: 10 };
    else if (stockStatus === 'IN') filter.stock = { $gt: 10 };
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ title: rx }, { sku: rx }, { description: rx }];
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = filter.price || {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const createdAt = buildDateRange(query.createdFrom, query.createdTo);
  if (createdAt) filter.createdAt = createdAt;

  const sort = buildSort(query.sort, ADMIN_PRODUCT_SORT_FIELDS, {
    createdAt: -1,
  });

  const products = await productRepository.find(filter, {
    skip,
    limit,
    sort,
    populate: ['category', 'brand'],
  });
  const total = await productRepository.countDocuments(filter);

  return { products, meta: getPaginationMeta(total, page, limit) };
};

export const bulkUpdateProducts = async (ids = [], payload = {}) => {
  const validIds = (Array.isArray(ids) ? ids : []).filter(id =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (validIds.length === 0) {
    throw new AppError('No products selected', 400);
  }

  const { action } = payload;

  if (action === 'delete') {
    const result = await productRepository.updateMany(
      { _id: { $in: validIds } },
      { status: PRODUCT_STATUS.DELETED },
    );
    return { modified: result.modifiedCount };
  }

  const update = {};
  if (payload.status) update.status = String(payload.status).toLowerCase();
  if (payload.featured !== undefined)
    update.featured = Boolean(payload.featured);

  if (Object.keys(update).length === 0) {
    throw new AppError('Nothing to update', 400);
  }

  const result = await productRepository.updateMany(
    { _id: { $in: validIds } },
    update,
  );
  return { modified: result.modifiedCount };
};

export const getProductById = async id => {
  const product = await productRepository.findById(id, {
    populate: ['category', 'brand'],
  });
  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

export const getProductBySlug = async slug => {
  const product = await productRepository.findBySlug(slug);
  if (!product || product.status !== PRODUCT_STATUS.ACTIVE) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

export const updateProduct = async (id, data) => {
  if (data.title) {
    data.slug = generateSlug(data.title);
    const existingProduct = await productRepository.findOne({
      slug: data.slug,
      _id: { $ne: id },
    });
    if (existingProduct) {
      throw new AppError('Product with this title already exists', 400);
    }
  }

  if (data.category) {
    const category = await resolveCategory(data.category);
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    data.category = category._id;
  }

  if (data.brand) {
    const brand = await brandRepository.findById(data.brand);
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  const product = await productRepository.findByIdAndUpdate(id, data);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

export const deleteProduct = async id => {
  const product = await productRepository.findByIdAndUpdate(id, {
    status: PRODUCT_STATUS.DELETED,
  });
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

export const getFeaturedProducts = async () => {
  return await productRepository.find(
    {
      featured: true,
      status: PRODUCT_STATUS.ACTIVE,
    },
    {
      limit: 8,
      sort: { createdAt: -1 },
      populate: ['category', 'brand'],
    },
  );
};

export const getBestSellers = async () => {
  return await productRepository.find(
    {
      status: PRODUCT_STATUS.ACTIVE,
    },
    {
      limit: 8,
      sort: { sold: -1 },
      populate: ['category', 'brand'],
    },
  );
};

export const getNewArrivals = async () => {
  return await productRepository.find(
    {
      status: PRODUCT_STATUS.ACTIVE,
    },
    {
      limit: 8,
      sort: { createdAt: -1 },
      populate: ['category', 'brand'],
    },
  );
};

export const getDiscountProducts = async () => {
  return await productRepository.find(
    {
      status: PRODUCT_STATUS.ACTIVE,
      discountPrice: { $gt: 0 },
    },
    {
      limit: 8,
      sort: { createdAt: -1 },
      populate: ['category', 'brand'],
    },
  );
};