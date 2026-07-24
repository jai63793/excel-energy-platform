/**
 * Global centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Global-Error-Handler]', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
