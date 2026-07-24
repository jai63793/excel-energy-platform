import dotenv from 'dotenv';
import app from './app.js';
import { initCronJobs } from './services/cron.service.js';

// Load environmental parameters
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start Server Listeners
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`⚡ Excel Energy Backend Server Running on Port: ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
  
  // 1. Kickstart background reminder cron-scheduler jobs
  initCronJobs();
});

// Process Level Safety Crash Handlers
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down immediately...', err);
  process.exit(1);
});
