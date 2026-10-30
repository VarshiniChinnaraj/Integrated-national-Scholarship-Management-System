const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'national_scholarship_secret_key_2026_jwt'
      );

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Account not found or inactive'
        });
      }

      if (user.status && user.status.toLowerCase() !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Your account is deactivated or suspended. Please contact administrator.'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no bearer token provided'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Usage: authorizeRoles('INSTITUTE_OFFICER', 'ADMIN')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires [${roles.join(', ')}] role. Current role is ${req.user.role}.`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorizeRoles
};
