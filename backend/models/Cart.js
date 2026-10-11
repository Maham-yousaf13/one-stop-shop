const mongoose = require('mongoose');

// ==================== CART SCHEMA ====================
// One cart per user — created automatically when first item is added
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Ensures one cart per user (one-to-one relationship)
    },

    // ==================== CART ITEMS ====================
    // Similar to orderItems — we store product details as a snapshot
    // so the cart displays correctly even if product price/name changes
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        image: { type: String, default: '' },
        quantity: {
          type: Number,
          required: true,
          min: 1,        // Cannot be less than 1
          default: 1,
        },
      },
    ],

    // ==================== CALCULATED TOTALS ====================
    // Stored for fast retrieval — updated via calculateTotals() method
    totalItems: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ==================== INSTANCE METHOD ====================
// Recalculates totalItems and totalPrice based on current items
// Must be called after any add/update/remove operation
cartSchema.methods.calculateTotals = function () {
  // Sum all item quantities
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);

  // Sum all (price × quantity)
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return this; // Allows chaining: cart.calculateTotals().save()
};

module.exports = mongoose.model('Cart', cartSchema);