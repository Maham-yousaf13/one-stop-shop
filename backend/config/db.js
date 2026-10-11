const mongoose = require('mongoose');

// ==================== MONGODB CONNECTION ====================
// Establishes connection to MongoDB Atlas using the MONGO_URI from .env
// This is called once when the server starts (in server.js)
const connectDB = async () => {
  try {
    // Connect to MongoDB Atlas
    // MONGO_URI format: mongodb://user:pass@host:port/database?options
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log success with the host name (not the password!)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Fatal error — cannot run the app without a database
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Exit process with failure code (1 = error)
    // This prevents the server from running with a broken DB connection
    process.exit(1);
  }
};

module.exports = connectDB;