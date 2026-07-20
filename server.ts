require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');
const { getSession } = require('./helpers/auth');

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie', 'X-Total-Count'],
}));

app.use(express.json({ limit: '10mb', verify: (req: any, _res: any, buf: any) => { req.rawBody = buf.toString(); } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(async (req: any, res: any, next: any) => {
  req.currentUser = await getSession(req);
  next();
});

app.use('/api', routes);

app.use((req: any, res: any) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((err: any, req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal: any) => {
      console.log(`\n${signal} received. Shutting down...`);
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err));
    process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); shutdown('uncaughtException'); });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
