import express from 'express';
import rateLimit from 'express-rate-limit';
import { chatWithAssistant } from '../controllers/aiController.js';
import { validate } from '../middlewares/index.js';
import { chatSchema } from '../validators/index.js';

const router = express.Router();

// Dedicated, stricter limiter so the AI endpoint cannot be spammed.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: {
    success: false,
    message:
      'Too many AI assistant requests. Please wait a few minutes and try again.',
  },
});

router.post('/chat', aiLimiter, validate(chatSchema), chatWithAssistant);

export default router;
