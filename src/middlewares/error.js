import { config } from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate field value: ${field}`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message
    }));
    message = 'Validation error';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired! Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
