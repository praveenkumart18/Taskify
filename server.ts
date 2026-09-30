import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });

import express from 'express';
import { createServer as createViteServer } from 'vite';
import connectDB from './server/config/db.js';
import app from './server/app.js';

const PORT = 3000;

async function bootstrap() {
  // Connect to MongoDB using the configured credentials
  await connectDB();

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Taskify Full-Stack Server running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
});
