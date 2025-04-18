/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error status and message
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;