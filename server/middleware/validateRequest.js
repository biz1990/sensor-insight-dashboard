/**
 * Middleware for validating request data
 * @param {Object} schema - Validation schema (e.g., Joi schema)
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    if (!schema) return next();
    
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details.map(detail => detail.message).join(', ')
      });
    }
    
    next();
  };
};

module.exports = validateRequest;