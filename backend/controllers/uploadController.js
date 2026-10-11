const cloudinary = require('../config/cloudinary');

// ==================== UPLOAD IMAGES ====================
// @desc    Upload multiple product images to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
//
// Note: The actual file upload is handled by multer middleware
// (uploadMiddleware.js) BEFORE this controller runs.
// By the time we reach here, req.files is already populated
// with Cloudinary URLs from the uploaded images.
const uploadImages = async (req, res) => {
  try {
    // Safety check — multer might not have attached any files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // Extract just the Cloudinary URLs from the files array
    // Each file object contains: path, size, mimetype, filename, etc.
    // We only need the URL (stored in `path`)
    const imageUrls = req.files.map((file) => file.path);

    // Return the URLs so the frontend can attach them to a product
    res.status(200).json({
      message: 'Images uploaded successfully',
      count: imageUrls.length,
      images: imageUrls,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== DELETE IMAGE ====================
// @desc    Delete a single image from Cloudinary using its public ID
// @route   DELETE /api/upload/:publicId
// @access  Private/Admin
const deleteImage = async (req, res) => {
  try {
    const publicId = req.params.publicId;

    // Call Cloudinary's destroy API to delete the image
    const result = await cloudinary.uploader.destroy(publicId);

    // Cloudinary returns { result: 'ok' } on successful deletion
    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete image' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadImages, deleteImage };