import express from 'express';
import * as wishlistController from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);
router.delete('/', wishlistController.clearWishlist);

export default router;
