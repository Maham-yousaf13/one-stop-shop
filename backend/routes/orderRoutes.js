const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markAsPaid,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ==================== USER ROUTES ====================
// Requires authentication (any logged-in user)

// Create new order from cart
router.post('/', protect, createOrder);

// ⚠️ IMPORTANT: '/myorders' must come BEFORE '/:id'
// Otherwise Express will treat 'myorders' as an order ID
router.get('/myorders', protect, getMyOrders);

// Get single order by ID (user can only access their own)
router.get('/:id', protect, getOrderById);

// Mark order as paid (simulated payment)
router.put('/:id/pay', protect, markAsPaid);

// ==================== ADMIN ROUTES ====================
// Requires authentication + admin role

// Get all orders with filters and revenue stats
router.get('/', protect, adminOnly, getAllOrders);

// Update order status (Pending → Processing → Shipped → Delivered)
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;