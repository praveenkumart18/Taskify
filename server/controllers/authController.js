import User from '../models/User.js';
import { generateToken, clearTokenCookie } from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new user (pre-save hook in User model hashes the password)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    // Set HTTP-only cookie with JWT
    const token = generateToken(res, user._id);

    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Return safe user information (never return password)
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: safeUser,
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & get token cookie
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });

    // Compare password using bcrypt
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Set HTTP-only cookie with JWT
    const token = generateToken(res, user._id);

    const safeUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Return safe user response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
      data: {
        user: safeUser,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * @desc    Log out user & clear HTTP-only cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logoutUser = (req, res) => {
  clearTokenCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getCurrentUser = (req, res) => {
  const safeUser = {
    _id: req.user.id,
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
  };

  return res.status(200).json({
    success: true,
    user: safeUser,
    data: {
      user: safeUser,
    },
  });
};
