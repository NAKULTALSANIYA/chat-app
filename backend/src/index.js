import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { createServer } from 'http';
import router from './routes/index.js';
import { connectDb } from './config/db.js';
import { initializeSocketIO } from './services/socketService.js';
import { initializeFirebase } from './services/notificationService.js';
import { logger } from './utils/logger.js';

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // For production, add your mobile app's specific origins here
      // const allowedOrigins = ['your-app-scheme://'];
      // if (allowedOrigins.includes(origin)) {
      //   return callback(null, true);
      // }
      
      // Reject browser requests from other origins
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);
app.use(morgan('dev'));

app.use('/api', router);

app.use((err, req, res, _next) => {
  logger.error(err);
  res.status(500).json({ message: 'Internal error', error: err.message });
});

// Initialize Firebase Cloud Messaging
initializeFirebase();

// Initialize Socket.IO
initializeSocketIO(server);

const port = process.env.PORT || 3000;

connectDb()
  .then(() => {
    server.listen(port, () => logger.info(`API listening on ${port}`));
  })
  .catch((err) => {
    logger.error('Startup error', err);
    process.exit(1);
  });