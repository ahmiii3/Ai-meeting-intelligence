const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI Meeting Intelligence API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      workspaces: '/api/workspaces'
    }
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred'
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // alter: true updates existing columns without dropping data
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📍 API Endpoints:`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   - Workspaces: http://localhost:${PORT}/api/workspaces`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
