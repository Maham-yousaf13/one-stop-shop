const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== PROTECT MIDDLEWARE ====================
// Verifies JWT token and attaches authenticated user to req.user
// Used on routes that require a logged-in user
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from 'Bearer <token>' format
      // Split by space → ['Bearer', '<token>'] → take index [1]
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature and expiry using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB using the ID stored in token payload
      // .select('-password') excludes password field for security
      req.user = await User.findById(decoded.id).select('-password');

      // User might have been deleted after token was issued
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Attach successful — proceed to next middleware/controller
      next();
    } catch (error) {
      // Token is invalid, tampered with, or expired
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // No Authorization header or wrong format
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// ==================== ADMIN-ONLY MIDDLEWARE ====================
// Grants access only if req.user.role === 'admin'
// Must be used AFTER protect middleware (needs req.user to exist)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Admin verified — proceed
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

module.exports = { protect, adminOnly };