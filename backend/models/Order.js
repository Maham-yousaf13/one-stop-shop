const mongoose = require('mongoose');

// ==================== ORDER SCHEMA ====================
const orderSchema = new mongoose.Schema(
  {
    // Customer who placed this order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ==================== ORDER ITEMS ====================
    // Snapshot of products at the time of purchase
    // We store name, price, image directly (not just reference)
    // because product details may change later, but order history must not
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        image: { type: String },
      },
    ],

    // ==================== SHIPPING ADDRESS ====================
    // Ireland-specific address fields
    shippingAddress: {
      street:  { type: String, required: true },
      city:    { type: String, required: true },
      county:  { type: String, required: true },  // Irish county
      eircode: { type: String, required: true },  // Irish postal code
      country: { type: String, default: 'Ireland' },
    },

    // ==================== PAYMENT ====================
    paymentMethod: {
      type: String,
      required: true,
      default: 'Stripe', // Options: 'Stripe', 'PayPal', 'COD'
    },
    // Payment gateway response (id, status, email from Stripe/PayPal)
    paymentResult: {
      id:     String,
      status: String,
      email:  String,
    },

    // ==================== PRICING BREAKDOWN ====================
    itemsPrice:    { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice:      { type: Number, required: true, default: 0 }, // VAT included in price (Ireland)
    totalPrice:    { type: Number, required: true, default: 0 },

    // ==================== PAYMENT STATUS ====================
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // ==================== DELIVERY STATUS ====================
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // ==================== ORDER STATUS ====================
    // Tracks the order lifecycle
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },

    // Courier tracking number (e.g., An Post tracking for Ireland)
    trackingNumber: { type: String, default: '' },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Order', orderSchema);