import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri, { dbName: 'fcm_demo' });
  logger.info('MongoDB connected');
};