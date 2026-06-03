const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const http = require('http');

const sequelize = require('./config/db');
const { initializeSocket } = require('./config/socket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const transcriptRoutes = require('./routes/transcriptRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const testRoutes = require('./routes/testRoutes');

// Import models (to ensure they're registered with Sequelize)
require('./models/User');
require('./models/Workspace');
require('./models/Meeting');
require('./models/Transcript');
require('./models/Task');
require('./models/MeetingSummary');
require('./models/EmailLog');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/test', testRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AI Meeting Intelligence API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      workspaces: '/api/workspaces',
      meetings: '/api/meetings',
      transcripts: '/api/transcripts',
      tasks: '/api/tasks',
      test: '/api/test'
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
    // Connect to PostgreSQL (Supabase)
    // Sync tables - case-sensitive table names fixed
    await sequelize.sync({ force: false, logging: false });
    console.log('✅ PostgreSQL (Supabase) synced successfully');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📍 API Endpoints:`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   - Workspaces: http://localhost:${PORT}/api/workspaces`);
      console.log(`   - Meetings: http://localhost:${PORT}/api/meetings`);
      console.log(`   - Transcripts: http://localhost:${PORT}/api/transcripts`);
      console.log(`   - Tasks: http://localhost:${PORT}/api/tasks`);
      console.log(`   - Analysis: http://localhost:${PORT}/api/analysis`);
      console.log(`🔌 Socket.IO: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
