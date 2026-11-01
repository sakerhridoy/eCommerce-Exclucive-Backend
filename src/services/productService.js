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
} from '../utils/index.js';

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
