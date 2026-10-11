const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ==================== HELPER FUNCTION ====================
// Generate a JWT token signed with the user's ID
// Token expires in 30 days — after that, user must log in again
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ==================== REGISTER USER ====================
// @desc    Register a new user account
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // ==================== VALIDATION ====================
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // ==================== CHECK DUPLICATE EMAIL ====================
    // Prevent two accounts with the same email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // ==================== CREATE USER ====================
    // Password is automatically hashed by the pre-save middleware in User model
    const user = await User.create({ name, email, password, phone });

    // Return user data + JWT token (never return the password)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== LOGIN USER ====================
// @desc    Authenticate a user and return a JWT token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==================== VALIDATION ====================
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // ==================== FIND USER ====================
    const user = await User.findOne({ email });
    if (!user) {
      // Note: Same error message for wrong email OR wrong password
      // This prevents attackers from knowing which one is incorrect
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ==================== VERIFY PASSWORD ====================
    // matchPassword method compares entered password with the hashed one in DB
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ==================== SUCCESS ====================
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== GET USER PROFILE ====================
// @desc    Get the logged-in user's profile
// @route   GET /api/auth/profile
// @access  Private (requires valid JWT token)
const getUserProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    // .select('-password') excludes the password field from the response
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };