import express from 'express';
import * as brandController from '../controllers/index.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { brandSchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.get('/slug/:slug', brandController.getBrandBySlug);

router.post('/', authenticate, requirePermission(PERMISSIONS.BRAND_MANAGE), validate(brandSchema), brandController.createBrand);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.BRAND_MANAGE), validate(brandSchema), brandController.updateBrand);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.BRAND_MANAGE), brandController.deleteBrand);

export default router;
