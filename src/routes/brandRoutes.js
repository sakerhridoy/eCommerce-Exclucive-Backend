import express from 'express';
import * as brandController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { brandSchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.get('/slug/:slug', brandController.getBrandBySlug);

router.post('/', authenticate, authorize(ROLES.ADMIN), validate(brandSchema), brandController.createBrand);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), validate(brandSchema), brandController.updateBrand);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), brandController.deleteBrand);

export default router;
