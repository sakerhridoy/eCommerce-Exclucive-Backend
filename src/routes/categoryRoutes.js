import express from 'express';
import * as categoryController from '../controllers/index.js';
import { authenticate, requirePermission } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { categorySchema } from '../validators/index.js';
import { PERMISSIONS } from '../utils/index.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

router.post('/', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), validate(categorySchema), categoryController.createCategory);
router.put('/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), validate(categorySchema), categoryController.updateCategory);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.CATEGORY_MANAGE), categoryController.deleteCategory);

export default router;
