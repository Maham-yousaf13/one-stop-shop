const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ==================== AUTH ROUTES ====================

// Register new user account
// Public route — no token required
router.post('/register', registerUser);

// Login user and receive JWT token
// Public route — no token required
router.post('/login', loginUser);

// Get logged-in user's profile
// Protected route — requires valid JWT token
router.get('/profile', protect, getUserProfile);

module.exports = router;