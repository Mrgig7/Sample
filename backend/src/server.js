const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

// ── Validate required environment variables ──────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`);
  // In serverless, process.exit kills the function — log and let requests fail gracefully
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

// Connect to database
connectDB();

const app = express();

// ── CORS configuration ──────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/calendars', require('./routes/calendarRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/shares', require('./routes/shareRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/availability', require('./routes/availabilityRoutes'));

// Root route (for browser / uptime checks)
app.get('/', (req, res) => {
  res.status(200).json({ service: 'CalManage API', status: 'running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Cron jobs (only when running as persistent server, not serverless) ──
if (!process.env.VERCEL) {
  require('./jobs/reminderJob')();
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack })
  });
});

// ── Start server (only when NOT deployed as Vercel serverless function) ──
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
