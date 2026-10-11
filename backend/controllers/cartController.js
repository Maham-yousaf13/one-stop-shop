const Cart = require('../models/Cart');
const Product = require('../models/Product');

// ==================== ADD TO CART ====================
// @desc    Add a product to the user's cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // ==================== VALIDATION ====================
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify product is still active (not soft-deleted)
    if (!product.isActive) {
      return res.status(400).json({ message: 'Product is not available' });
    }

    // Check initial stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // ==================== FIND OR CREATE CART ====================
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // First time user — create an empty cart
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    // ==================== CHECK IF PRODUCT ALREADY IN CART ====================
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // ==================== UPDATE EXISTING ITEM ====================
      // Product already in cart — increase the quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;

      // Prevent exceeding stock when adding more
      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} items available in stock`,
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // ==================== ADD NEW ITEM ====================
      // Store a snapshot of product details at the time of adding
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0] || '', // Use first image or empty string
        quantity,
      });
    }

    // ==================== SAVE ====================
    cart.calculateTotals(); // Recalculate totalItems & totalPrice
    await cart.save();

    // Populate product details for the response
    await cart.populate('items.product', 'name price images stock');

    res.status(200).json({
      message: 'Product added to cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET CART ====================
// @desc    Retrieve the user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name price images stock isActive'
    );

    // Return empty cart structure if user has no cart yet
    if (!cart) {
      return res.json({
        user: req.user._id,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE CART ITEM QUANTITY ====================
// @desc    Update the quantity of a specific item in the cart
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // ==================== VALIDATION ====================
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // ==================== STOCK CHECK ====================
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // ==================== FIND CART ====================
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // ==================== FIND ITEM IN CART ====================
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    // ==================== UPDATE ====================
    cart.items[itemIndex].quantity = quantity;
    cart.calculateTotals();
    await cart.save();

    await cart.populate('items.product', 'name price images stock');

    res.json({
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== REMOVE ITEM FROM CART ====================
// @desc    Remove a single product from the cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if the item exists in the cart
    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    // Filter out the item
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.calculateTotals();
    await cart.save();

    await cart.populate('items.product', 'name price images stock');

    res.json({
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== CLEAR ENTIRE CART ====================
// @desc    Remove all items from the cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Reset everything
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;
    await cart.save();

    res.json({
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};