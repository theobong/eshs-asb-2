import mongoose from 'mongoose';

export async function checkMongoConnection(): Promise<boolean> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eshs-asb';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.log('MongoDB connection failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

export async function connectWithRetry(maxRetries: number = 5, delay: number = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    const connected = await checkMongoConnection();
    if (connected) return true;

    if (i < maxRetries - 1) {
      console.log(`Retrying MongoDB connection in ${delay/1000}s... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log('Failed to connect to MongoDB after multiple attempts');
  return false;
}
