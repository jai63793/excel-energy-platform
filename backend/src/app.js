import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

// Import Middlewares
import { errorHandler } from './middleware/error.js';
import { apiRateLimiter } from './middleware/rateLimit.js';

// Import Route maps
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import bookingRoutes from './routes/booking.routes.js';

const app = express();

// 1. Security Headers configuration
app.use(helmet());

// 2. Cross Origin Resource Sharing (CORS) Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// 3. Payload and cookie processing parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. General API Rate Limiting
app.use('/api', apiRateLimiter);

// Custom Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  if (req.method !== 'GET') {
    console.log(`  Payload:`, JSON.stringify(req.body));
  }
  next();
});

// 5. REST Route mappings
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/bookings', bookingRoutes);

// Test API Status Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Excel Energy Platform API Server is healthy and running.' 
  });
});

// 6. Fallback Catch-All Route for Undefined endpoints
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
});

// 7. Central Error Handling Middleware
app.use(errorHandler);

export default app;
