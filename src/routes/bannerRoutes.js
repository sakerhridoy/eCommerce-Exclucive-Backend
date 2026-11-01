import express from 'express';
import * as bannerController from '../controllers/index.js';
import { authenticate, authorize } from '../middlewares/index.js';
import { validate } from '../middlewares/index.js';
import { bannerSchema } from '../validators/index.js';
import { ROLES } from '../utils/index.js';

const router = express.Router();

router.get('/', bannerController.getBanners);
router.get('/:id', authenticate, authorize(ROLES.ADMIN), bannerController.getBannerById);

router.post('/', authenticate, authorize(ROLES.ADMIN), validate(bannerSchema), bannerController.createBanner);
router.put('/:id', authenticate, authorize(ROLES.ADMIN), validate(bannerSchema), bannerController.updateBanner);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), bannerController.deleteBanner);

export default router;
