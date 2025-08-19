const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const linkedinRoutes = require('./routes/linkedin');
const googleSheets = require('./services/googleSheets');
const automationService = require('./services/automationService');
const { logEnvironmentStatus, getSystemInfo } = require('./utils/validation');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/linkedin', linkedinRoutes);

// === AUTOMATION ROUTES ===

// LinkedIn Connection
app.post('/api/automation/linkedin-connection', async (req, res) => {
  try {
    const result = await automationService.sendLinkedInConnection(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// LinkedIn Message
app.post('/api/automation/linkedin-message', async (req, res) => {
  try {
    const result = await automationService.sendLinkedInMessage(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate AI Email
app.post('/api/automation/generate-email', async (req, res) => {
  try {
    const result = await automationService.generatePersonalizedEmail(req.body.prospect);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send Email
app.post('/api/automation/send-email', async (req, res) => {
  try {
    const result = await automationService.sendEmail(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Schedule Follow-up
app.post('/api/automation/schedule-followup', async (req, res) => {
  try {
    const result = await automationService.scheduleFollowUp(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Scheduled Follow-ups
app.get('/api/automation/followups', async (req, res) => {
  try {
    const followUps = await automationService.getScheduledFollowUps();
    res.json({ success: true, followUps });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Automation Health Check
app.get('/api/automation/health', async (req, res) => {
  try {
    const health = await automationService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Extract LinkedIn Profile (for testing/debugging)
app.post('/api/automation/extract-profile', async (req, res) => {
  try {
    const { linkedinUrl } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'LinkedIn URL is required' 
      });
    }
    
    const linkedinProfileExtractor = require('./services/linkedinProfileExtractor');
    const result = await linkedinProfileExtractor.extractDetailedProfile(linkedinUrl);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Google Sheets routes
app.get('/api/sheets/data', async (req, res) => {
  try {
    const data = await googleSheets.getSheetData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prospects in a clean format
app.get('/api/prospects', async (req, res) => {
  try {
    const initialized = await googleSheets.initialize();
    if (!initialized) {
      return res.status(500).json({ error: 'Google Sheets not initialized' });
    }

    const data = await googleSheets.getSheetData();
    if (!data || data.length <= 1) {
      return res.json({ success: true, prospects: [] });
    }

    // Expected headers: ["ID", "Nom", "Entreprise", "Poste", "LinkedIn URL", "Localisation", "Date d'ajout", "Statut", "Message envoyé", "Nb relances", "Notes"]
    const headers = data[0];
    const prospects = data.slice(1).map((row, index) => {
      // Handle inconsistent data by finding the correct columns
      let prospect = {};
      
      // If row has data in the expected positions (0-10)
      if (row[1] && row[1] !== '') {
        prospect = {
          id: row[0] || `row_${index + 2}`,
          name: row[1] || 'Nom non spécifié',
          company: row[2] || 'Entreprise non spécifiée',
          title: row[3] || 'Titre non spécifié',
          linkedinUrl: row[4] || '',
          location: row[5] || '',
          dateAdded: row[6] || '',
          status: row[7] || 'Nouveau',
          messageSent: row[8] || '',
          followupCount: row[9] || '0',
          notes: row[10] || ''
        };
      } 
      // If data is in later columns (offset issue)
      else if (row.length > 14 && row[15] && row[15] !== '') {
        prospect = {
          id: row[14] || `row_${index + 2}`,
          name: row[16] || 'Nom non spécifié',
          company: row[18] || 'Entreprise non spécifiée', 
          title: row[17] || 'Titre non spécifié',
          linkedinUrl: row[20] || '',
          location: row[19] || '',
          dateAdded: row[15] || '',
          status: row[23] || 'Nouveau',
          messageSent: '',
          followupCount: '0',
          notes: ''
        };
      }
      // Skip empty rows
      else if (row.join('').trim() === '') {
        return null;
      }
      // Default fallback
      else {
        prospect = {
          id: `prospect_${index + 2}`,
          name: 'Nom non spécifié',
          company: 'Entreprise non spécifiée',
          title: 'Titre non spécifié',
          linkedinUrl: '',
          location: '',
          dateAdded: '',
          status: 'Nouveau',
          messageSent: '',
          followupCount: '0',
          notes: ''
        };
      }

      // Extract additional info from notes if available
      if (prospect.notes) {
        const emailMatch = prospect.notes.match(/Email: ([^|]+)/);
        const scoreMatch = prospect.notes.match(/Score: ([^|]+)/);
        const tagsMatch = prospect.notes.match(/Tags: ([^|]+)/);
        
        prospect.email = emailMatch ? emailMatch[1].trim() : '';
        prospect.score = scoreMatch ? scoreMatch[1].trim() : '0';
        prospect.tags = tagsMatch ? tagsMatch[1].trim() : '';
      }

      return prospect;
    }).filter(p => p !== null);

    res.json({ success: true, prospects });
  } catch (error) {
    console.error('Error getting prospects:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets/append', async (req, res) => {
  try {
    const { values } = req.body;
    const result = await googleSheets.appendToSheet(values);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets/update', async (req, res) => {
  try {
    const { range, value } = req.body;
    const result = await googleSheets.updateCell(range, value);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets/clear', async (req, res) => {
  try {
    await googleSheets.clearSheet();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google OAuth routes
app.get('/api/auth/google', async (req, res) => {
  try {
    const authUrl = await googleSheets.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET callback for Google OAuth redirect
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect('/?error=no_code');
    }
    
    const success = await googleSheets.saveToken(code);
    if (success) {
      await googleSheets.initialize();
      res.redirect('/?auth=success');
    } else {
      res.redirect('/?error=auth_failed');
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

app.post('/api/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const success = await googleSheets.saveToken(code);
    if (success) {
      await googleSheets.initialize();
    }
    res.json({ success });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  logger.info('Health check requested', { component: 'API' });
  
  const googleSheetsReady = await googleSheets.initialize();
  
  // Check LinkedIn cookie status
  const linkedinStatus = process.env.LINKEDIN_COOKIE ? 'ready' : 'no-cookie';
  
  const healthData = {
    status: 'running',
    googleSheets: googleSheetsReady ? 'connected' : 'disconnected',
    linkedin: linkedinStatus,
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
    dailyLimit: process.env.DAILY_LIMIT || '50',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  };
  
  logger.info('Health check completed', { 
    component: 'API', 
    status: healthData.status,
    googleSheets: healthData.googleSheets,
    linkedin: healthData.linkedin
  });
  
  res.json(healthData);
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const data = await googleSheets.getSheetData();
    if (!data || data.length <= 1) {
      return res.json({
        totalProspects: 0,
        byStatus: {},
        bySource: {},
        recentActivity: []
      });
    }
    
    const prospects = data.slice(1); // Skip header
    const totalProspects = prospects.length;
    
    // Count by status
    const byStatus = prospects.reduce((acc, row) => {
      const status = row[9] || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by tags (source)
    const bySource = prospects.reduce((acc, row) => {
      const tags = row[14] || 'Unknown';
      acc[tags] = (acc[tags] || 0) + 1;
      return acc;
    }, {});
    
    // Recent activity (last 10 prospects)
    const recentActivity = prospects
      .slice(-10)
      .map(row => ({
        name: row[2] || 'Unknown',
        company: row[4] || '',
        dateAdded: row[1] || '',
        status: row[9] || 'Unknown'
      }))
      .reverse();
    
    res.json({
      totalProspects,
      byStatus,
      bySource,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk operations
app.post('/api/prospects/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // Array of {row, column, value}
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array is required' });
    }
    
    const initialized = await googleSheets.initialize();
    if (!initialized) {
      return res.status(500).json({ error: 'Google Sheets not initialized' });
    }
    
    // Process bulk updates
    const results = [];
    for (const update of updates) {
      try {
        const range = `${update.column}${update.row}`;
        await googleSheets.updateCell(range, update.value);
        results.push({ success: true, range, value: update.value });
      } catch (error) {
        results.push({ success: false, range: `${update.column}${update.row}`, error: error.message });
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System info endpoint
app.get('/api/system', (req, res) => {
  const systemInfo = getSystemInfo();
  res.json({
    ...systemInfo,
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Logs endpoint
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const level = req.query.level; // Optional filter by level
  
  let logs = logger.getRecentLogs(limit);
  
  // Filter by level if specified
  if (level) {
    logs = logs.filter(log => log.level.toLowerCase() === level.toLowerCase());
  }
  
  res.json({
    success: true,
    logs,
    total: logs.length,
    timestamp: new Date().toISOString()
  });
});

// Clear logs endpoint
app.post('/api/logs/clear', (req, res) => {
  logger.recentLogs = [];
  logger.info('Logs cleared via API', { component: 'API' });
  res.json({ success: true, message: 'Logs cleared' });
});

// Initialize services
async function initialize() {
  console.log('🚀 Starting Prospection System v2.0.0...');
  
  // Validate environment
  const envValidation = logEnvironmentStatus();
  
  if (!envValidation.isValid) {
    console.log('\n❌ Cannot start server due to missing environment variables.');
    console.log('📝 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  try {
    // Initialize Google Sheets
    const sheetsReady = await googleSheets.initialize();
    if (sheetsReady) {
      console.log('✅ Google Sheets connected');
      await googleSheets.setupHeaders();
    } else {
      console.log('⚠️ Google Sheets not connected - authentication required');
    }
    
    // Initialize Automation Service
    const automationReady = await automationService.initialize();
    if (automationReady) {
      console.log('✅ Automation service ready');
    } else {
      console.log('⚠️ Automation service has limited functionality');
    }
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
  }
  
  // Start server
  app.listen(PORT, () => {
    console.log(`\n🎆 Server running at http://localhost:${PORT}`);
    console.log('🌐 Web interface: http://localhost:3000');
    console.log('📝 Available endpoints:');
    console.log('  - GET  /                      (Web interface)');
    console.log('  - GET  /api/health            (System status)');
    console.log('  - POST /api/linkedin/search   (Search profiles)');
    console.log('  - POST /api/linkedin/add-to-crm (Add to Google Sheets)');
    console.log('  - GET  /api/sheets/data       (Get CRM data)');
    console.log('  - GET  /api/analytics         (Get analytics)');
    console.log('  - POST /api/prospects/bulk-update (Bulk updates)');
    console.log('\n✨ System ready!\n');
  });
}

initialize().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🚪 Shutting down gracefully...');
  process.exit(0);
});
