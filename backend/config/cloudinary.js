// Import Cloudinary SDK (v2 is the current stable version)
const cloudinary = require('cloudinary').v2;

// ==================== CLOUDINARY CONFIGURATION ====================
// Load credentials from .env file
// These are used by cloudinary.uploader.* methods (upload, destroy)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export the configured instance for use across the app
module.exports = cloudinary;