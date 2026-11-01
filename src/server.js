import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';

let server;

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('DB connection successful!');

    server = app.listen(config.port, () => {
      console.log(`App running on port ${config.port}...`);
    });
  } catch (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
