import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// Consistent JSON shape for every throttled request (matches sendResponse).
const rateLimitHandler = message => (req, res) => {
  res.status(429).json({ success: false, message });
};

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  // `trust proxy` is enabled in app.js; silence the spoofing warning since
  // we only ever key by IP behind a known reverse proxy.
  validate: { trustProxy: false },
};

// Global safety net for the whole API surface.
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: config.rateLimit.windowMs,
  limit: config.rateLimit.max,
  handler: rateLimitHandler(
    'Too many requests from this IP, please try again later.',
  ),
});

// Brute-force protection for login/register/reset. Only failed attempts count
// towards the limit so genuine users are never locked out by normal usage.
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler(
    'Too many attempts from this IP. Please try again after 15 minutes.',
  ),
});

// Prevents fake/spam order flooding (e.g. scripted checkout) per IP.
export const orderLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  handler: rateLimitHandler(
    'Too many orders placed from this IP. Please try again later.',
  ),
});

// Stops the contact form being abused to send spam.
export const contactLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler: rateLimitHandler(
    'Too many messages sent from this IP. Please try again later.',
  ),
});
