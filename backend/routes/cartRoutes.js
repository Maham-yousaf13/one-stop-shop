const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// ==================== CART ROUTES ====================
// All cart routes are protected — user must be logged in

// Route: /api/cart
router.route('/')
  .get(protect, getCart)          // GET  — Retrieve user's cart
  .post(protect, addToCart)       // POST — Add product to cart
  .delete(protect, clearCart);    // DELETE — Clear entire cart

// Route: /api/cart/:productId
router.route('/:productId')
  .put(protect, updateCartItem)     // PUT    — Update item quantity
  .delete(protect, removeFromCart); // DELETE — Remove single item from cart

module.exports = router;