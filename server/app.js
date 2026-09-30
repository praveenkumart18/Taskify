import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import taskListRoutes from './routes/taskListRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security: Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Security: Standard security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Body parser middleware with payload size limit to prevent memory-exhaustion attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser middleware for reading auth cookies
app.use(cookieParser());

// CORS configuration supporting credentials (cookies)
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Health-check endpoint
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    success: true,
    message: 'Taskify API is running smoothly',
    status: 'online',
    database: {
      status: dbStates[mongoose.connection.readyState] || 'unknown',
      connected: isConnected,
      name: mongoose.connection.name || 'Taskify',
      host: mongoose.connection.host || 'unknown',
      readyState: mongoose.connection.readyState,
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Task List routes
app.use('/api/tasklists', taskListRoutes);

// Direct Task routes
app.use('/api/tasks', taskRoutes);

// Catch unmatched /api routes and return 404 JSON
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
