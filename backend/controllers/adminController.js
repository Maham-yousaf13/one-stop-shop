const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// ==================== DASHBOARD STATS ====================
// @desc    Get high-level dashboard stats (for the cards at top of admin panel)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // ==================== PARALLEL COUNTS ====================
    // Promise.all runs all count queries at the SAME TIME (much faster than sequential)
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }), // Excludes admins
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
    ]);

    // ==================== TOTAL REVENUE ====================
    // Sum of totalPrice from all PAID orders
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    // ==================== TODAY'S REVENUE ====================
    // Start of today (midnight) — used to filter orders created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRevenueData = await Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const todayRevenue =
      todayRevenueData.length > 0 ? todayRevenueData[0].total : 0;

    // ==================== RESPONSE ====================
    res.json({
      totalRevenue: totalRevenue.toFixed(2),   // Round to 2 decimals
      todayRevenue: todayRevenue.toFixed(2),
      totalOrders,
      totalProducts,
      totalUsers,
      ordersByStatus: {
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== MONTHLY SALES ====================
// @desc    Get monthly sales data for the last 12 months (for a chart)
// @route   GET /api/admin/monthly-sales
// @access  Private/Admin
const getMonthlySales = async (req, res) => {
  try {
    // Calculate the date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlySales = await Order.aggregate([
      // ==================== FILTER ====================
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: twelveMonthsAgo }, // Only last 12 months
        },
      },

      // ==================== GROUP BY YEAR + MONTH ====================
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalSales: { $sum: '$totalPrice' }, // Sum revenue
          orderCount: { $sum: 1 },             // Count orders
        },
      },

      // Sort chronologically (oldest to newest)
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Map month numbers (1-12) to names (Jan-Dec)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formatted = monthlySales.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      sales: item.totalSales,
      orders: item.orderCount,
    }));

    res.json({ monthlySales: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== RECENT ORDERS ====================
// @desc    Get the 5 most recent orders
// @route   GET /api/admin/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 }) // Newest first
      .limit(5);                // Only 5 orders

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== TOP SELLING PRODUCTS ====================
// @desc    Get top 5 best-selling products (by quantity sold)
// @route   GET /api/admin/top-products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      // ==================== UNWIND ORDER ITEMS ====================
      // Converts orderItems array into individual documents (one per item)
      // This lets us aggregate across all orders for each product
      { $unwind: '$orderItems' },

      // ==================== GROUP BY PRODUCT ====================
      {
        $group: {
          _id: '$orderItems.product',              // Group by product ID
          name: { $first: '$orderItems.name' },    // Take first name
          image: { $first: '$orderItems.image' },  // Take first image
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
          },
        },
      },

      // Sort by most sold, take top 5
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({ topProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== LOW STOCK PRODUCTS ====================
// @desc    Get products with low stock (for restocking alerts)
// @route   GET /api/admin/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res) => {
  try {
    // Threshold can be customized via query param (?threshold=10)
    const threshold = req.query.threshold || 5;

    const products = await Product.find({
      isActive: true,
      stock: { $lte: Number(threshold) }, // stock <= threshold
    })
      .select('name stock price images category')
      .populate('category', 'name')
      .sort({ stock: 1 }); // Lowest stock first (most urgent)

    res.json({ count: products.length, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlySales,
  getRecentOrders,
  getTopProducts,
  getLowStockProducts,
};