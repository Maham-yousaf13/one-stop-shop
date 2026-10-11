const express = require('express');
const router = express.Router();
const { uploadImages, deleteImage } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ==================== UPLOAD ROUTES ====================
// All routes require authentication + admin role

// Upload multiple images (maximum 5 at once)
// Middleware chain: protect → adminOnly → multer (file parsing) → uploadImages controller
router.post(
  '/',
  protect,                          // 1. Verify JWT token
  adminOnly,                        // 2. Ensure user is admin
  upload.array('images', 5),        // 3. Parse files from 'images' field (max 5)
  uploadImages                      // 4. Handle Cloudinary URLs
);

// Delete single image from Cloudinary using its public ID
router.delete('/:publicId', protect, adminOnly, deleteImage);

module.exports = router;