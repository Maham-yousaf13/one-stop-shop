const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ==================== CLOUDINARY STORAGE CONFIG ====================
// Multer will store uploaded files directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // Folder path in Cloudinary Media Library
    folder: 'onestopshop/products',

    // Only allow these image formats
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],

    // Auto-optimization applied to every uploaded image
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Resize if larger than 1000x1000
      { quality: 'auto:good' },                     // Auto-compress with good quality
    ],
  },
});

// ==================== FILE TYPE FILTER ====================
// Rejects files that are not valid images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only JPG, JPEG, PNG and WEBP images are allowed'), false); // Reject file
  }
};

// ==================== MULTER INSTANCE ====================
// Combines storage, filter, and size limit into a single upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file (in bytes)
  },
});

module.exports = upload;