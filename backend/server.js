// ✅ Load environment variables FIRST (before any other imports)
// This is critical — Cloudinary and other configs depend on env vars
const dotenv = require('dotenv');
dotenv.config();

// Core dependencies
const express = require('express');
const cors = require('cors');

// Database connection
const connectDB = require('./config/db');

// API Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to MongoDB Atlas
connectDB();

// Initialize Express application
const app = express();

// ==================== MIDDLEWARE ====================
// Enable CORS — allows frontend (React) to communicate with backend
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded form data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);       // Authentication (register, login, profile)
app.use('/api/products', productRoutes); // Product CRUD + filters
app.use('/api/upload', uploadRoutes);    // Image upload to Cloudinary
app.use('/api/cart', cartRoutes);        // Shopping cart operations
app.use('/api/orders', orderRoutes);     // Order management
app.use('/api/admin', adminRoutes);      // Admin analytics dashboard

// ==================== HEALTH CHECK ====================
// Root endpoint — used to verify API is running
app.get('/', (req, res) => {
  res.json({
    message: '🛒 One Stop Shop API is running...',
    status: 'success',
    shop: 'One Stop Shop Ireland',
    timestamp: new Date().toISOString(),
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});