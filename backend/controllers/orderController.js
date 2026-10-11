const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ==================== CREATE ORDER ====================
// @desc    Create new order from the user's cart
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = 'COD' } = req.body;

    // ==================== VALIDATION ====================
    if (!shippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.county ||
      !shippingAddress.eircode
    ) {
      return res.status(400).json({
        message: 'Please provide complete shipping address (street, city, county, eircode)',
      });
    }

    // ==================== FIND USER'S CART ====================
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // ==================== STOCK VALIDATION ====================
    // Verify each product is still available and has enough stock
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);

      if (!product || !product.isActive) {
        return res.status(400).json({
          message: `Product ${item.name} is no longer available`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${product.stock} items of ${item.name} available in stock`,
        });
      }
    }

    // ==================== BUILD ORDER ITEMS ====================
    // Snapshot product details at the time of order
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));

    // ==================== PRICE CALCULATION ====================
    const itemsPrice = cart.totalPrice;
    const shippingPrice = itemsPrice > 50 ? 0 : 5.99; // Free shipping on orders over €50 (Ireland standard)
    const taxPrice = 0; // VAT is already included in product prices in Ireland
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // ==================== CREATE ORDER ====================
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        county: shippingAddress.county,
        eircode: shippingAddress.eircode,
        country: shippingAddress.country || 'Ireland',
      },
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    });

    // ==================== DECREMENT PRODUCT STOCK ====================
    // Reduce stock for each ordered item
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity }, // $inc with negative value = decrement
      });
    }

    // ==================== CLEAR CART ====================
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET USER'S ORDERS ====================
// @desc    Get all orders for the logged-in user
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1, // Newest orders first
    });

    res.json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET SINGLE ORDER ====================
// @desc    Get a single order by ID (owner or admin only)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email phone'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // ==================== ACCESS CONTROL ====================
    // Allow access only if the requester is the order owner OR an admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET ALL ORDERS (ADMIN) ====================
// @desc    Get all orders with filters, pagination, and revenue stats
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build filter (optional status filter)
    const filter = {};
    if (status) filter.status = status;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(filter);

    // ==================== REVENUE AGGREGATION ====================
    // Calculate total revenue from all paid orders using MongoDB aggregation
    const revenueData = await Order.aggregate([
      { $match: { isPaid: true } },              // Only paid orders
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }, // Sum totalPrice
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.json({
      orders,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
      totalRevenue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE ORDER STATUS (ADMIN) ====================
// @desc    Update order status and optionally add tracking number
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    // Validate status against allowed values
    const validStatuses = [
      'Pending',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Selective updates
    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Auto-set delivered flag when status becomes 'Delivered'
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    res.json({
      message: 'Order status updated',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== MARK ORDER AS PAID ====================
// @desc    Mark an order as paid (simulated payment for now)
// @route   PUT /api/orders/:id/pay
// @access  Private
const markAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only the order owner can mark it as paid
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update payment fields
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: req.body.id || 'SIMULATED_' + Date.now(), // Real gateway would provide this
      status: req.body.status || 'COMPLETED',
      email: req.user.email,
    };

    const updatedOrder = await order.save();

    res.json({
      message: 'Order marked as paid',
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  markAsPaid,
};