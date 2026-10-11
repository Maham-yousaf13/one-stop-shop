const Product = require('../models/Product');
const Category = require('../models/Category');

// ==================== CREATE PRODUCT ====================
// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    // Extract all possible fields from request body
    const {
      name,
      description,
      price,
      comparePrice,
      category,
      subCategory,
      brand,
      images,
      stock,
      sku,
      isFeatured,
      isNewArrival,
      isOnSale,
      tags,
    } = req.body;

    // ==================== VALIDATION ====================
    // Check required fields (stock can be 0, so we check undefined)
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Verify that the referenced category actually exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // ==================== AUTO-GENERATE SLUG ====================
    // Create SEO-friendly URL slug from product name
    // Example: "iPhone 15 Pro Max!" → "iphone-15-pro-max-1729985600000"
    const slug =
      name
        .toLowerCase()                    // Convert to lowercase
        .replace(/[^a-z0-9]+/g, '-')      // Replace non-alphanumeric with hyphen
        .replace(/(^-|-$)/g, '') +        // Remove leading/trailing hyphens
      '-' + Date.now();                    // Append timestamp for uniqueness

    // ==================== CREATE PRODUCT ====================
    const product = await Product.create({
      name,
      slug,
      description,
      price,
      comparePrice: comparePrice || 0,
      category,
      subCategory: subCategory || null,
      brand: brand || '',
      images: images || [],
      stock,
      sku: sku || '',
      isFeatured: isFeatured || false,
      isNewArrival: isNewArrival || false,
      isOnSale: isOnSale || false,
      tags: tags || [],
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET ALL PRODUCTS (with filters) ====================
// @desc    Get all products with optional filters, search, sorting, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Extract query parameters (defaults for pagination)
    const {
      category,
      subCategory,
      search,
      minPrice,
      maxPrice,
      isNewArrival,
      isFeatured,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    // ==================== BUILD FILTER OBJECT ====================
    // Start with only active products
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (isNewArrival === 'true') filter.isNewArrival = true;
    if (isFeatured === 'true') filter.isFeatured = true;

    // Price range filter (MongoDB operators: $gte = >=, $lte = <=)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Full-text search using the text index we defined in Product model
    if (search) {
      filter.$text = { $search: search };
    }

    // ==================== SORTING ====================
    // Default: newest products first
    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };    // Low → High
    if (sort === 'price-desc') sortOption = { price: -1 };  // High → Low
    if (sort === 'name-asc') sortOption = { name: 1 };      // A → Z
    if (sort === 'name-desc') sortOption = { name: -1 };    // Z → A

    // ==================== PAGINATION ====================
    // Skip items from previous pages
    const skip = (Number(page) - 1) * Number(limit);

    // ==================== EXECUTE QUERY ====================
    const products = await Product.find(filter)
      .populate('category', 'name slug')      // Replace category ID with details
      .populate('subCategory', 'name slug')   // Replace subcategory ID with details
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination metadata
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)), // Total number of pages
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET SINGLE PRODUCT ====================
// @desc    Get a single product by its ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== UPDATE PRODUCT ====================
// @desc    Update an existing product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // ==================== SELECTIVE UPDATE ====================
    // Only update fields that were actually provided in the request
    // This prevents accidentally clearing fields with undefined values
    const updatableFields = [
      'name', 'description', 'price', 'comparePrice', 'category',
      'subCategory', 'brand', 'images', 'stock', 'sku',
      'isFeatured', 'isNewArrival', 'isOnSale', 'tags', 'isActive',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updatedProduct = await product.save();

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== DELETE PRODUCT ====================
// @desc    Delete a product permanently
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};