import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI?.trim() || '';

// Mongoose connection for app data
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
  var mongoClientPromise: Promise<MongoClient | null> | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('[mongodb] MONGODB_URI is not configured. Database features will be disabled.');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((connection) => connection)
      .catch((error) => {
        console.error('[mongodb] Connection attempt failed:', error);
        cached.promise = null;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('[mongodb] Connection failed:', error);
    return null;
  }

  return cached.conn;
}

// MongoClient for NextAuth adapter
let clientPromise: Promise<MongoClient | null>;

const createClientPromise = () => {
  if (!MONGODB_URI) {
    console.warn('[mongodb] MONGODB_URI is not configured. MongoDB adapter disabled.');
    return Promise.resolve(null);
  }

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  return client.connect().catch((error) => {
    console.error('[mongodb] Mongo client connection failed:', error);
    return null;
  });
};

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across module reloads
  if (!global.mongoClientPromise) {
    global.mongoClientPromise = createClientPromise();
  }
  clientPromise = global.mongoClientPromise;
} else {
  // In production mode, create a new client
  clientPromise = createClientPromise();
}

export { clientPromise };
export default connectDB;
