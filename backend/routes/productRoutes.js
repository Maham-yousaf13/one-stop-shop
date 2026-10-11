const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================
// No authentication required — anyone can browse products

// Get all products with filters (category, price, search, sort, pagination)
router.get('/', getProducts);

// Get single product by ID
router.get('/:id', getProductById);

// ==================== ADMIN-ONLY ROUTES ====================
// Require authentication (protect) + admin role (adminOnly)

// Create new product
router.post('/', protect, adminOnly, createProduct);

// Update existing product
router.put('/:id', protect, adminOnly, updateProduct);

// Delete product
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;