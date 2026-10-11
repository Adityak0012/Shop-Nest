import mongoose from 'mongoose';
import { env, isProd } from './env.js';

let memoryServer = null;

/**
 * Connects to MongoDB.
 * - If MONGO_URI is set, it is used (local MongoDB or MongoDB Atlas).
 * - Otherwise, in development, an in-memory MongoDB is started so the app runs
 *   with zero setup. Data in this mode is reset every time the server restarts.
 * Returns true when the in-memory database was used (so the caller can seed it).
 */
export async function connectDB() {
  let uri = env.mongoUri;
  let inMemory = false;

  if (!uri) {
    if (isProd) throw new Error('MONGO_URI is required in production');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    console.log('[db] MONGO_URI not set - starting an in-memory MongoDB (first run downloads it, please wait)...');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('shopnest');
    inMemory = true;
  }

  await mongoose.connect(uri);
  console.log(`[db] connected to ${inMemory ? 'in-memory MongoDB' : mongoose.connection.host}`);
  return inMemory;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
