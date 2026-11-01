import express from 'express';
import {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIpn,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-session', initPayment);
router.post('/success/:tran_id', paymentSuccess);
router.post('/fail/:tran_id', paymentFail);
router.post('/cancel/:tran_id', paymentCancel);
router.post('/ipn', paymentIpn);

export default router;