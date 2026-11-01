import express from 'express';
import * as productController from '../controllers/index.js';
import {
  authenticate,
  authorize,
  validate,
  upload,
} from '../middlewares/index.js';
import { productSchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  upload.single('image'),
  validate(productSchema),
  productController.createProduct,
);

router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  upload.single('image'),
  validate(productSchema),
  productController.updateProduct,
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  productController.deleteProduct,
);

export default router;