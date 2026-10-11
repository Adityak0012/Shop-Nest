import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env, razorpayEnabled } from './config/env.js';
import { seedDatabase, syncProductImages } from './seed/seed.js';
import { Product } from './models/Product.js';

async function start() {
  const inMemory = await connectDB();

  // Fill an empty database with demo products and accounts
  if (inMemory || (await Product.estimatedDocumentCount()) === 0) {
    await seedDatabase();
  }
  await syncProductImages();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] ShopNest API running on http://localhost:${env.port}`);
    console.log(`[api] Razorpay: ${razorpayEnabled ? 'enabled (test mode keys)' : 'not configured - Cash on Delivery only'}`);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[api] failed to start:', err.message);
  process.exit(1);
});
