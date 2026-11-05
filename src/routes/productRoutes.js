import express from 'express';
import * as productController from '../controllers/index.js';
import {
  authenticate,
  requirePermission,
  validate,
  upload,
} from '../middlewares/index.js';
import { productSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

// Up to 5+ product images are uploaded under the `images` field; `image` is
// still accepted for backwards compatibility with older single-image clients.
const productImages = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 },
]);

router.get('/', productController.getProducts);

// Admin listing + bulk actions (must precede '/:id')
router.get(
  '/admin/list',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_VIEW),
  productController.getAdminProducts,
);
router.patch(
  '/admin/bulk',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  productController.bulkUpdateProducts,
);

router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  productImages,
  validate(productSchema),
  productController.createProduct,
);

router.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  productImages,
  validate(productSchema),
  productController.updateProduct,
);

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.PRODUCT_DELETE),
  productController.deleteProduct,
);

export default router;
