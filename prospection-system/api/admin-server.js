/**
 * React Admin API Server
 * REST API for prospection-system admin interface
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware - Secure CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// Import route handlers
const campaigns = require('./routes/campaigns');
const prospects = require('./routes/prospects');
const messages = require('./routes/messages');
const activities = require('./routes/activities');

// API Routes
app.use('/api/campaigns', campaigns);
app.use('/api/prospects', prospects);
app.use('/api/messages', messages);
app.use('/api/activities', activities);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ React Admin API server running on http://localhost:${PORT}`);
  console.log(`📊 Admin interface: http://localhost:3001`);
});

module.exports = app;
