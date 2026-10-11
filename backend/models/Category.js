const mongoose = require('mongoose');

// ==================== CATEGORY SCHEMA ====================
// Supports self-referencing hierarchy: parent categories and subcategories
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
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
      default: '',
    },
    image: {
      type: String,
      default: '', // Cloudinary URL for category banner image
    },
    icon: {
      type: String,
      default: '', // Icon name or URL for category display
    },
    // ==================== SELF-REFERENCE ====================
    // Points to another Category document
    // null  = top-level (main) category
    // value = this is a subcategory of the referenced parent
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true, // Soft delete — set false to hide from frontend
    },
    displayOrder: {
      type: Number,
      default: 0, // Lower numbers appear first in navigation
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);