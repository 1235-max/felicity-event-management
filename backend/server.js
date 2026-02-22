import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Route imports
import authRoutes from './routes/auth.js';
import participantRoutes from './routes/participant.js';
import organizerRoutes from './routes/organizer.js';
import adminRoutes from './routes/admin.js';
import eventRoutes from './routes/event.js';
import ticketRoutes from './routes/ticket.js';
import merchandiseRoutes from './routes/merchandise.js';
import attendanceRoutes from './routes/attendance.js';
import forumRoutes from './routes/forum.js';
import feedbackRoutes from './routes/feedback.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for payment proof images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Felicity API is running', status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/felicity';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
