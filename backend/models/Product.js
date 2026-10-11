const mongoose = require('mongoose');

// ==================== PRODUCT SCHEMA ====================
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: 0,
    },
    comparePrice: {
      type: Number,
      default: 0, // Original price (used to display discounts)
    },
    currency: {
      type: String,
      default: 'EUR', // Irish currency
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    brand: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String, // Cloudinary image URLs
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents with no SKU (null)
    },
    isFeatured: {
      type: Boolean,
      default: false, // Shown in "Featured Products" section
    },
    isNewArrival: {
      type: Boolean,
      default: false, // Shown in "New Arrivals" section
    },
    isOnSale: {
      type: Boolean,
      default: false, // Shown in "On Sale" section
    },
    tags: [String], // For filtering and search
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isActive: {
      type: Boolean,
      default: true, // Soft delete — set to false instead of removing
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// ==================== INDEXES ====================
// Text search index for product search functionality
// Enables full-text search across name, description, brand, and tags
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);