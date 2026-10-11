const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getMonthlySales,
  getRecentOrders,
  getTopProducts,
  getLowStockProducts,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ==================== ADMIN ROUTES ====================
// All routes require authentication (protect) AND admin role (adminOnly)

// Dashboard statistics — total revenue, orders, users, products, order status breakdown
router.get('/stats', protect, adminOnly, getDashboardStats);

// Monthly sales data for the last 12 months (for charts)
router.get('/monthly-sales', protect, adminOnly, getMonthlySales);

// Most recent 5 orders with customer details
router.get('/recent-orders', protect, adminOnly, getRecentOrders);

// Top 5 best-selling products by quantity sold
router.get('/top-products', protect, adminOnly, getTopProducts);

// Products with low stock (default threshold: 5 units)
router.get('/low-stock', protect, adminOnly, getLowStockProducts);

module.exports = router;