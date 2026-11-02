const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes/controllers
app.set('io', io);

// WebSocket connections
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/water', require('./routes/water'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/villages', require('./routes/villages'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/predict-risk', require('./routes/predict'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// DB + Server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health_monitoring';

mongoose.connect(MONGO_URI, { bufferCommands: false, serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('✅ MongoDB connected');
    // Seed demo users on successful connection
    try {
      const authRoutes = require('./routes/auth');
      if (authRoutes.seedDemoUsers) {
        authRoutes.seedDemoUsers().catch(err => console.error('Seeding failed:', err.message));
      }
    } catch (e) {}
    
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️ Running without database (demo mode) is enabled.');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (WARNING: DB is down)`));
  });

module.exports = { app, server };
