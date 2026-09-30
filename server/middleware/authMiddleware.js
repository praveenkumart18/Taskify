import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes and verify JWT from HTTP-only cookies
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Read JWT from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Optional Bearer token header support for flexible API client testing
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is found, reject request
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  try {
    // 2. Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3 & 4. Find user by decoded userId (excluding password)
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // 5. Attach safe user object to req.user
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
};

export default protect;
