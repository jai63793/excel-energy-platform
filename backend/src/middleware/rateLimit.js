import rateLimit from 'express-rate-limit';

/**
 * Limit OTP requests to max 5 requests per 15 minutes from one IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 5,
  message: {
    success: false,
    message: 'Too many OTP requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limit standard login requests to max 10 requests per 10 minutes from one IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API limiter to prevent DDoS, max 100 requests per minute
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
