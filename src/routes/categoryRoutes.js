import express from 'express';
import * as categoryController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { categorySchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

router.post('/', authenticate, authorize(ROLES.ADMIN), validate(categorySchema), categoryController.createCategory);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), validate(categorySchema), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), categoryController.deleteCategory);

export default router;
