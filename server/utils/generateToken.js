import jwt from 'jsonwebtoken';

/**
 * Generate JWT and set it in an HTTP-only cookie
 * @param {Response} res - Express response object
 * @param {string|mongoose.Types.ObjectId} userId - User ID
 */
export const generateToken = (res, userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables.');
  }

  // Generate signed JWT token
  const token = jwt.sign({ userId }, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Set HTTP-only secure cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

/**
 * Clear the authentication cookie on logout
 * @param {Response} res - Express response object
 */
export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
};

export default generateToken;
