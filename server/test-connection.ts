import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');

    const mongoUri = process.env.MONGODB_URI;
    console.log('Connection URI:', mongoUri?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB connected successfully');

    console.log('Testing database operations...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database handle is not available on the mongoose connection');
    }

    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    const stats = await db.stats();
    console.log('Database stats:', {
      collections: stats.collections,
      documents: stats.objects,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`
    });

    console.log('Connection test completed successfully');

  } catch (error) {
    console.error('MongoDB connection failed:', error);

    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
    process.exit(0);
  }
}

testConnection();
