import express from 'express';
import * as cartController from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

const router = express.Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/items/:itemId', cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);

export default router;
