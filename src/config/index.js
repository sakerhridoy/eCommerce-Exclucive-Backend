import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getSecret = (name, fallback) => {
  const value = process.env[name];
  if (
    isProduction &&
    (!value || value.length < 32 || /^your[-_ ]/i.test(value))
  ) {
    throw new Error(
      `${name} must be set to a unique value of at least 32 characters in production`,
    );
  }
  return value || fallback;
};

const port = toNumber(process.env.PORT, 5000);

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const frontendUrl =
  process.env.FRONTEND_URL || corsOrigins[0] || 'http://localhost:5173';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/singlev',

  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${port}/api/v1`,
  frontendUrl,

  jwt: {
    accessSecret: getSecret('JWT_ACCESS_SECRET', 'your-access-secret-key'),
    refreshSecret: getSecret('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    saltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: toNumber(process.env.EMAIL_PORT, 587),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@singlev.com',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  sslcommerz: {
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    sandbox: process.env.SSLCOMMERZ_SANDBOX === 'true',
  },

  cors: {
    origins: corsOrigins,
    origin: corsOrigins[0] || 'http://localhost:5173',
  },

  cookie: {
    secret: getSecret('COOKIE_SECRET', 'your-cookie-secret'),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
};