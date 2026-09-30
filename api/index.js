import connectDB from '../server/config/db.js';
import app from '../server/app.js';

export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection is active
    await connectDB();
  } catch (err) {
    console.error('Serverless database connection failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI is set in your Vercel project Environment Variables.',
      error: err.message,
    });
  }

  // Ensure req.url matches Express /api routes if rewritten by Vercel
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  return app(req, res);
}
