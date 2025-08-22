const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const linkedinRoutes = require('./routes/linkedin');
const googleSheets = require('./services/googleSheets');
const automationService = require('./services/automationService');
const emailNotificationService = require('./services/emailNotificationService');
const emailFinderService = require('./services/emailFinderService');
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

// Find Email Address
app.post('/api/automation/find-email', async (req, res) => {
  try {
    const { prospect } = req.body;
    
    if (!prospect || !prospect.name) {
      return res.status(400).json({ error: 'Prospect data with name is required' });
    }
    
    const result = await emailFinderService.findEmail(prospect);
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

// Remove duplicates from CRM
app.post('/api/prospects/remove-duplicates', async (req, res) => {
  try {
    const initialized = await googleSheets.initialize();
    if (!initialized) {
      return res.status(500).json({ error: 'Google Sheets not initialized' });
    }

    const data = await googleSheets.getSheetData();
    if (!data || data.length <= 1) {
      return res.json({ success: true, removed: 0, message: 'No data to process' });
    }

    const headers = data[0];
    const prospects = data.slice(1);
    
    // Find duplicates based on LinkedIn URL or Name+Company combination
    const seen = new Set();
    const duplicateIndices = [];
    
    prospects.forEach((row, index) => {
      const linkedinUrl = row[4]?.trim() || '';
      const name = row[1]?.trim() || '';
      const company = row[2]?.trim() || '';
      
      // Create unique identifier
      let identifier = '';
      if (linkedinUrl) {
        identifier = linkedinUrl.toLowerCase();
      } else if (name && company) {
        identifier = `${name.toLowerCase()}_${company.toLowerCase()}`;
      } else {
        identifier = `${name.toLowerCase()}_${index}`; // Fallback with index
      }
      
      if (seen.has(identifier)) {
        duplicateIndices.push(index + 2); // +2 because of header row and 1-based indexing
      } else {
        seen.add(identifier);
      }
    });
    
    if (duplicateIndices.length === 0) {
      return res.json({ success: true, removed: 0, message: 'No duplicates found' });
    }
    
    // Remove duplicates by clearing rows (from bottom to top to avoid index issues)
    duplicateIndices.sort((a, b) => b - a); // Descending order
    
    for (const rowIndex of duplicateIndices) {
      const range = `A${rowIndex}:K${rowIndex}`;
      await googleSheets.sheets.spreadsheets.values.clear({
        spreadsheetId: googleSheets.spreadsheetId,
        range,
      });
    }
    
    logger.info(`Removed ${duplicateIndices.length} duplicate prospects from CRM`, {
      component: 'CRM',
      duplicatesRemoved: duplicateIndices.length,
      totalProspects: prospects.length
    });
    
    res.json({
      success: true,
      removed: duplicateIndices.length,
      totalProspects: prospects.length,
      message: `Removed ${duplicateIndices.length} duplicate(s) from CRM`
    });
  } catch (error) {
    logger.error('Failed to remove duplicates', {
      component: 'CRM',
      error: error.message
    });
    res.status(500).json({ error: error.message });
  }
});

// Full workflow sequence with email notifications
app.post('/api/workflow/run-full-sequence', async (req, res) => {
  const workflowId = `workflow_${Date.now()}`;
  const startTime = Date.now();
  let workflowLogs = [];
  
  try {
    const { prospects, config } = req.body;
    
    if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
      return res.status(400).json({ error: 'Prospects array is required' });
    }
    
    // Log workflow start
    workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 🚀 Workflow démarré avec ${prospects.length} prospects`);
    workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚙️ Configuration: emails=${config?.actions?.generateEmails}, linkedin=${config?.actions?.sendLinkedInConnections}, followups=${config?.actions?.scheduleFollowups}`);
    
    // Determine if this is a bulk workflow (>10 prospects = bulk mode for performance)
    const isBulkWorkflow = prospects.length > 10;
    if (isBulkWorkflow) {
      workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚡ Mode BULK activé (${prospects.length} prospects) - génération rapide sans extraction profils LinkedIn`);
    }

    // Send workflow start notification
    await emailNotificationService.sendWorkflowStartNotification({
      prospects,
      config,
      workflowId
    });
    
    const results = {
      workflowId,
      prospectsProcessed: 0,
      emailsGenerated: 0,
      linkedinConnections: 0,
      followupsScheduled: 0,
      errors: [],
      warnings: [],
      bulkMode: isBulkWorkflow,
      logs: workflowLogs.join('\n')
    };
    
    // Process each prospect
    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 👤 Traitement de ${prospect.name} (${i + 1}/${prospects.length})`);
      
      try {
        // Find email address if not available
        if (!prospect.email || prospect.email.includes('not_unlocked') || prospect.email.includes('email_not_found')) {
          try {
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 🔍 Recherche email pour ${prospect.name}...`);
            const emailResult = await emailFinderService.findEmail(prospect);
            if (emailResult.success && emailResult.email) {
              prospect.email = emailResult.email;
              prospect.emailSource = emailResult.source;
              prospect.emailVerified = emailResult.verified;
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ✅ Email trouvé: ${emailResult.email} (${emailResult.source})`);
            } else {
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚠️ Aucun email trouvé pour ${prospect.name}`);
            }
          } catch (error) {
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur recherche email pour ${prospect.name}: ${error.message}`);
          }
        }
        
        // Generate email if requested
        if (config?.actions?.generateEmails) {
          try {
            const emailOptions = {
              bulkMode: isBulkWorkflow,
              extractProfile: !isBulkWorkflow // Only extract profiles for small workflows
            };
            const emailResult = await automationService.generatePersonalizedEmail(prospect, emailOptions);
            if (emailResult.success) {
              results.emailsGenerated++;
              const modeInfo = emailResult.bulkMode ? ' (mode rapide)' : '';
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ✅ Email généré pour ${prospect.name}${modeInfo}`);
            } else {
              results.warnings.push(`Failed to generate email for ${prospect.name}`);
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚠️ Échec génération email pour ${prospect.name}`);
            }
          } catch (error) {
            results.errors.push(`Email generation error for ${prospect.name}: ${error.message}`);
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur email pour ${prospect.name}: ${error.message}`);
          }
        }
        
        // Send LinkedIn connection if requested
        if (config?.actions?.sendLinkedInConnections && prospect.linkedinUrl) {
          try {
            const connectionResult = await automationService.sendLinkedInConnection({
              profileUrl: prospect.linkedinUrl,
              message: config.linkedinTemplate || 'Hello, I would like to connect with you.'
            });
            if (connectionResult.success) {
              results.linkedinConnections++;
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 🔗 Connexion LinkedIn envoyée à ${prospect.name}`);
            } else {
              results.warnings.push(`Failed to send LinkedIn connection to ${prospect.name}`);
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚠️ Échec connexion LinkedIn pour ${prospect.name}`);
            }
          } catch (error) {
            results.errors.push(`LinkedIn connection error for ${prospect.name}: ${error.message}`);
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur connexion LinkedIn pour ${prospect.name}: ${error.message}`);
          }
        }
        
        // Schedule follow-up if requested
        if (config?.actions?.scheduleFollowups) {
          try {
            const followupResult = await automationService.scheduleFollowUp({
              prospectId: prospect.id || prospect.name,
              prospectName: prospect.name,
              prospectEmail: prospect.email,
              scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              message: config.followupTemplate || 'Following up on our previous conversation.'
            });
            if (followupResult.success) {
              results.followupsScheduled++;
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 📅 Relance programmée pour ${prospect.name}`);
            } else {
              results.warnings.push(`Failed to schedule follow-up for ${prospect.name}`);
              workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ⚠️ Échec programmation relance pour ${prospect.name}`);
            }
          } catch (error) {
            results.errors.push(`Follow-up scheduling error for ${prospect.name}: ${error.message}`);
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur programmation relance pour ${prospect.name}: ${error.message}`);
          }
        }
        
        results.prospectsProcessed++;
        
        // Add delay between prospects to avoid rate limiting (shorter for bulk mode)
        if (i < prospects.length - 1) {
          const delay = isBulkWorkflow ? 500 : 2000; // 0.5s for bulk, 2s for regular
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        results.errors.push(`Error processing ${prospect.name}: ${error.message}`);
        workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur traitement ${prospect.name}: ${error.message}`);
      }
    }
    
    const endTime = Date.now();
    results.duration = endTime - startTime;
    results.logs = workflowLogs.join('\n');
    
    // Save updated prospects (with found emails) to CRM if requested
    if (config?.actions?.saveToCRM !== false) {
      try {
        workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 💾 Sauvegarde des prospects enrichis au CRM...`);
        
        const initialized = await googleSheets.initialize();
        if (initialized) {
          // Filter prospects that have been enriched with emails
          const enrichedProspects = prospects.filter(p => 
            p.email && !p.email.includes('not_unlocked') && !p.email.includes('email_not_found')
          );
          
          if (enrichedProspects.length > 0) {
            const prospectsToSave = enrichedProspects.map(prospect => ({
              id: prospect.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: prospect.name,
              company: prospect.company,
              title: prospect.title,
              linkedinUrl: prospect.linkedinUrl,
              location: prospect.location,
              email: prospect.email,
              score: prospect.score || 0,
              tags: `${prospect.tags || ''} ${prospect.emailSource ? `email:${prospect.emailSource}` : ''} ${prospect.emailVerified ? 'verified' : ''}`.trim()
            }));
            
            await googleSheets.addProspectsToSheet(prospectsToSave);
            workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ✅ ${enrichedProspects.length} prospects enrichis sauvegardés au CRM`);
          }
        }
      } catch (error) {
        workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] ❌ Erreur sauvegarde CRM: ${error.message}`);
        results.warnings.push(`CRM save error: ${error.message}`);
      }
    }
    
    workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 🎯 Workflow terminé - ${results.prospectsProcessed} prospects traités`);
    workflowLogs.push(`[${new Date().toLocaleString('fr-FR')}] 📊 Résultats: ${results.emailsGenerated} emails, ${results.linkedinConnections} connexions, ${results.followupsScheduled} relances`);
    
    // Send workflow end notification
    await emailNotificationService.sendWorkflowEndNotification(results);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    const errorResults = {
      workflowId,
      prospectsProcessed: 0,
      emailsGenerated: 0,
      linkedinConnections: 0,
      followupsScheduled: 0,
      errors: [error.message],
      warnings: [],
      logs: workflowLogs.join('\n'),
      duration: Date.now() - startTime
    };
    
    // Send error notification
    await emailNotificationService.sendErrorNotification(error, 'Workflow execution');
    
    logger.error('Workflow execution failed', {
      component: 'Workflow',
      error: error.message,
      workflowId
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      results: errorResults
    });
  }
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
    
    // Initialize Email Finder Service
    const emailFinderReady = await emailFinderService.initialize();
    if (emailFinderReady) {
      console.log('✅ Email finder service ready');
    } else {
      console.log('⚠️ Email finder service has limited functionality');
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
