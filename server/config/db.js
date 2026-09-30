import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance using Mongoose
 * Supports MONGO_URI, MONGODB_URI, MONGO_URL, or DATABASE_URL
 * Defaults the database name to 'Taskify'
 */
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URL ||
      process.env.DATABASE_URL;

    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables or secrets.');
    }

    const dbName = process.env.DB_NAME || 'Taskify';

    const conn = await mongoose.connect(mongoUri, {
      dbName,
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Ensure your MongoDB connection string is correct and accessible.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
