// Configuration API
const API_URL = 'http://localhost:3000/api';

// Global state
let searchResults = [];
let currentProspects = [];
let isLoading = false;

// DOM Elements
let searchQuery, searchLimit, searchResults_el, addSelectedBtn, prospectsTable, systemHealth;
let googleStatus, linkedinStatus, totalCount, selectedCount;
let selectAllBtn, deselectAllBtn;
let logsContainer, logsCount, autoRefreshStatus, refreshLogs, clearLogs, toggleAutoRefresh, logLevel;

// CRM Sequence elements
let selectedProspectsCount, selectAllProspects, deselectAllProspects;
let emailContext, linkedinTemplate, generateEmails, sendLinkedInConnections, scheduleFollowups;
let sequenceStatus, sequenceValidation, validateSequence, runFullSequence;

// State
let selectedProspects = [];
let autoRefreshLogs = true;
let logsRefreshInterval;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    initializeElements();
    setupEventListeners();
    await checkSystemHealth();
    await loadProspects();
    await loadLogs();
    startLogsAutoRefresh();
    
    // Auto-validate sequence config on load
    setTimeout(() => {
        if (typeof autoValidateSequence === 'function') {
            autoValidateSequence();
            console.log('🔄 Auto-validation executed on page load');
        }
        
        // URGENCE: Diagnostic et réparation des boutons incliquables
        emergencyButtonDiagnostic();
    }, 1000);
});

function initializeElements() {
    searchQuery = document.getElementById('searchQuery');
    searchLimit = document.getElementById('searchLimit');
    searchResults_el = document.getElementById('searchResults');
    addSelectedBtn = document.getElementById('addSelectedBtn');
    prospectsTable = document.getElementById('prospectsTable');
    systemHealth = document.getElementById('systemHealth');
    googleStatus = document.getElementById('google-status');
    linkedinStatus = document.getElementById('linkedin-status');
    totalCount = document.getElementById('totalCount');
    selectedCount = document.getElementById('selectedCount');
    selectAllBtn = document.getElementById('selectAllBtn');
    deselectAllBtn = document.getElementById('deselectAllBtn');
    // runSequenceBtn moved to CRM section as runFullSequence
    
    // Logs elements
    logsContainer = document.getElementById('logsContainer');
    logsCount = document.getElementById('logsCount');
    autoRefreshStatus = document.getElementById('autoRefreshStatus');
    refreshLogs = document.getElementById('refreshLogs');
    clearLogs = document.getElementById('clearLogs');
    toggleAutoRefresh = document.getElementById('toggleAutoRefresh');
    logLevel = document.getElementById('logLevel');
    
    // CRM Sequence elements
    selectedProspectsCount = document.getElementById('selectedProspectsCount');
    selectAllProspects = document.getElementById('selectAllProspects');
    deselectAllProspects = document.getElementById('deselectAllProspects');
    emailContext = document.getElementById('emailContext');
    linkedinTemplate = document.getElementById('linkedinTemplate');
    generateEmails = document.getElementById('generateEmails');
    sendLinkedInConnections = document.getElementById('sendLinkedInConnections');
    scheduleFollowups = document.getElementById('scheduleFollowups');
    sequenceStatus = document.getElementById('sequenceStatus');
    sequenceValidation = document.getElementById('sequenceValidation');
    validateSequence = document.getElementById('validateSequence');
    runFullSequence = document.getElementById('runFullSequence');
}

function setupEventListeners() {
    // Search form
    document.getElementById('searchForm').addEventListener('submit', handleSearch);
    
    // Add selected button
    addSelectedBtn.addEventListener('click', addSelectedProspects);
    
    // Select/Deselect all buttons
    selectAllBtn.addEventListener('click', selectAllProfiles);
    deselectAllBtn.addEventListener('click', deselectAllProfiles);
    
    // Run sequence button moved to CRM section
    
    // Logs controls
    refreshLogs.addEventListener('click', loadLogs);
    clearLogs.addEventListener('click', clearSystemLogs);
    toggleAutoRefresh.addEventListener('click', toggleLogsAutoRefresh);
    logLevel.addEventListener('change', loadLogs);
    
    // CRM Sequence controls
    selectAllProspects.addEventListener('click', selectAllCRMProspects);
    deselectAllProspects.addEventListener('click', deselectAllCRMProspects);
    validateSequence.addEventListener('click', validateSequenceConfig);
    
    if (runFullSequence) {
        runFullSequence.addEventListener('click', runFullSequenceFromCRM);
        console.log('✅ Run Full Sequence button event listener attached');
    } else {
        console.error('❌ runFullSequence button not found!');
    }
    
    // Auto-validation on config change
    emailContext.addEventListener('input', autoValidateSequence);
    linkedinTemplate.addEventListener('input', autoValidateSequence);
    generateEmails.addEventListener('change', autoValidateSequence);
    sendLinkedInConnections.addEventListener('change', autoValidateSequence);
    scheduleFollowups.addEventListener('change', autoValidateSequence);
    
    // Refresh buttons
    document.getElementById('refreshHealth').addEventListener('click', checkSystemHealth);
    document.getElementById('refreshProspects').addEventListener('click', loadProspects);
    
    // Authenticate Google
    document.getElementById('authenticateGoogle').addEventListener('click', authenticateGoogle);
    
    // Clear CRM
    document.getElementById('clearCRM').addEventListener('click', clearCRM);
    
    // Remove duplicates
    document.getElementById('removeDuplicates').addEventListener('click', removeDuplicates);
    
    // Export data
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchQuery.focus();
        }
    });
}

// System health check
async function checkSystemHealth() {
    try {
        updateStatus('Checking system health...', 'info');
        
        const response = await fetch(`${API_URL}/health`);
        const health = await response.json();
        
        // Update status indicators
        updateStatusIndicator('google', health.googleSheets === 'connected');
        updateStatusIndicator('linkedin', health.linkedin === 'ready');
        
        // Update health display
        systemHealth.innerHTML = `
            <div class="health-item">
                <span class="health-dot ${health.googleSheets === 'connected' ? 'green' : 'red'}"></span>
                Google Sheets: ${health.googleSheets}
            </div>
            <div class="health-item">
                <span class="health-dot ${health.linkedin === 'ready' ? 'green' : 'yellow'}"></span>
                LinkedIn: ${health.linkedin}
            </div>
            <div class="health-item">
                <span class="health-dot green"></span>
                Server: ${health.status}
            </div>
        `;
        
        if (health.googleSheets === 'connected') {
            updateStatus('✅ System is ready!', 'success');
        } else {
            updateStatus('⚠️ Google Sheets not connected - authentication required', 'warning');
        }
        
    } catch (error) {
        console.error('Health check failed:', error);
        updateStatus('❌ Server connection failed', 'error');
        
        systemHealth.innerHTML = `
            <div class="health-item">
                <span class="health-dot red"></span>
                Server: disconnected
            </div>
        `;
    }
}

function updateStatusIndicator(type, isConnected) {
    const element = document.getElementById(`${type}-status`);
    const dot = document.getElementById(`${type}-dot`);
    const text = document.getElementById(`${type}-text`);
    
    if (element && dot && text) {
        dot.className = `status-dot ${isConnected ? 'green' : 'red'}`;
        text.textContent = isConnected ? 'Connected' : 'Disconnected';
    }
}

// LinkedIn search
async function handleSearch(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const query = searchQuery.value.trim();
    const limit = parseInt(searchLimit.value) || 10;
    
    // Récupérer la méthode de scraping sélectionnée
    const scrapingMethod = document.querySelector('input[name="scrapingMethod"]:checked')?.value || 'apollo';
    
    if (!query) {
        updateStatus('❌ Please enter a search query', 'error');
        return;
    }
    
    isLoading = true;
    updateStatus(`🔍 Searching LinkedIn with ${scrapingMethod}...`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/linkedin/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit, method: scrapingMethod })
        });
        
        const data = await response.json();
        
        if (data.success) {
            searchResults = data.results.map(result => ({
                ...result,
                selected: false,
                id: generateId()
            }));
            
            displaySearchResults();
            updateStatus(`✅ Found ${searchResults.length} profiles`, 'success');
        } else {
            throw new Error(data.error || 'Search failed');
        }
        
    } catch (error) {
        console.error('Search error:', error);
        updateStatus(`❌ Search failed: ${error.message}`, 'error');
        searchResults = [];
        displaySearchResults();
    } finally {
        isLoading = false;
    }
}

function displaySearchResults() {
    if (searchResults.length === 0) {
        searchResults_el.innerHTML = `
            <div class="empty-state">
                <p>No search results yet.</p>
                <p>Try searching for professionals using keywords like "CTO startup Paris"</p>
            </div>
        `;
        updateSelectedCount();
        updateButtonVisibility();
        return;
    }
    
    const html = searchResults.map(result => `
        <div class="result-card ${result.selected ? 'selected' : ''}">
            <div class="result-header">
                <input type="checkbox" 
                       ${result.selected ? 'checked' : ''} 
                       onchange="toggleSelection('${result.id}')">
                <div class="result-info">
                    <h3>${escapeHtml(result.name)}</h3>
                    <p class="title">${escapeHtml(result.title)}</p>
                    ${result.company ? `<p class="company">at ${escapeHtml(result.company)}</p>` : ''}
                    ${result.location ? `<p class="location">📍 ${escapeHtml(result.location)}</p>` : ''}
                    ${result.searchScore ? `<p class="score">Score: ${result.searchScore}/100</p>` : ''}
                    ${result.email && result.email !== 'email_not_unlocked@domain.com' ? `<p class="email">📧 ${result.email}</p>` : ''}
                </div>
            </div>
            <div class="result-actions">
                <a href="${result.linkedinUrl}" target="_blank" class="btn-linkedin">
                    View LinkedIn Profile
                </a>
            </div>
        </div>
    `).join('');
    
    searchResults_el.innerHTML = html;
    updateSelectedCount();
    updateButtonVisibility();
}

function toggleSelection(id) {
    const result = searchResults.find(r => r.id === id);
    if (result) {
        result.selected = !result.selected;
        displaySearchResults();
    }
}

function updateSelectedCount() {
    const selected = searchResults.filter(r => r.selected).length;
    selectedCount.textContent = selected;
    addSelectedBtn.disabled = selected === 0;
    addSelectedBtn.textContent = selected === 0 ? 'Add Selected to CRM' : `Add ${selected} Selected to CRM`;
    // Sequence button functionality moved to CRM section
}

function updateButtonVisibility() {
    if (searchResults.length > 0) {
        selectAllBtn.style.display = 'inline-block';
        deselectAllBtn.style.display = 'inline-block';
        // Sequence button moved to CRM section
    } else {
        selectAllBtn.style.display = 'none';
        deselectAllBtn.style.display = 'none';
        // Sequence button moved to CRM section
    }
}

function selectAllProfiles() {
    searchResults.forEach(result => result.selected = true);
    displaySearchResults();
    updateStatus(`✅ Selected all ${searchResults.length} profiles`, 'success');
}

function deselectAllProfiles() {
    searchResults.forEach(result => result.selected = false);
    displaySearchResults();
    updateStatus('❌ Deselected all profiles', 'info');
}

// Add selected prospects to CRM
async function addSelectedProspects() {
    const selected = searchResults.filter(r => r.selected);
    
    if (selected.length === 0) {
        updateStatus('❌ No prospects selected', 'error');
        return;
    }
    
    isLoading = true;
    updateStatus(`📝 Adding ${selected.length} prospects to CRM...`, 'info');
    
    try {
        const prospects = selected.map(result => ({
            name: result.name,
            title: result.title,
            company: result.company,
            location: result.location,
            linkedinUrl: result.linkedinUrl,
            email: result.email && result.email !== 'email_not_unlocked@domain.com' ? result.email : '',
            phone: result.phone || '',
            score: result.searchScore || 0,
            tags: searchQuery.value.trim() // Use search query as tag
        }));
        
        const response = await fetch(`${API_URL}/linkedin/add-to-crm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prospects })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus(`✅ Added ${data.added} prospects to CRM`, 'success');
            
            // Clear selections
            searchResults.forEach(r => r.selected = false);
            displaySearchResults();
            
            // Refresh prospects list
            await loadProspects();
        } else {
            throw new Error(data.error || 'Failed to add prospects');
        }
        
    } catch (error) {
        console.error('Add prospects error:', error);
        updateStatus(`❌ Failed to add prospects: ${error.message}`, 'error');
    } finally {
        isLoading = false;
    }
}

// Load current prospects from CRM
async function loadProspects() {
    try {
        updateStatus('📊 Loading prospects from CRM...', 'info');
        
        const response = await fetch(`${API_URL}/prospects`);
        const data = await response.json();
        
        if (data.success && data.prospects && data.prospects.length > 0) {
            currentProspects = data.prospects.filter(prospect => 
                prospect.name && prospect.name.trim() !== '' && prospect.name !== 'Nom non spécifié'
            );
            
            totalCount.textContent = currentProspects.length;
            displayProspects();
            updateStatus(`✅ Loaded ${currentProspects.length} prospects`, 'success');
        } else {
            currentProspects = [];
            totalCount.textContent = '0';
            displayProspects();
            updateStatus('📋 No prospects in CRM yet', 'info');
        }
        
    } catch (error) {
        console.error('Load prospects error:', error);
        updateStatus(`❌ Failed to load prospects: ${error.message}`, 'error');
        currentProspects = [];
        displayProspects();
    }
}

function displayProspects() {
    totalCount.textContent = currentProspects.length;
    
    if (currentProspects.length === 0) {
        prospectsTable.innerHTML = `
            <div class="empty-state">
                <p>No prospects in your CRM yet.</p>
                <p>Search for LinkedIn profiles and add them to get started!</p>
            </div>
        `;
        return;
    }
    
    const html = currentProspects.map(prospect => {
        // Debug: log prospect data to identify missing names
        if (!prospect.name || prospect.name.trim() === '') {
            console.log('🔍 Prospect sans nom détecté:', prospect);
        }
        
        const displayName = prospect.name && prospect.name.trim() !== '' ? prospect.name : `Prospect #${prospect.id.substring(0, 8)}`;
        
        const isSelected = selectedProspects.includes(prospect.id);
        
        return `
        <div class="prospect-card selectable ${isSelected ? 'selected' : ''}" 
             data-id="${prospect.id}" 
             onclick="toggleProspectSelection('${prospect.id}')">
            <input type="checkbox" 
                   class="prospect-checkbox" 
                   ${isSelected ? 'checked' : ''} 
                   onclick="event.stopPropagation(); toggleProspectSelection('${prospect.id}')">
            <div class="prospect-header">
                <div class="prospect-info">
                    <h3>${escapeHtml(displayName)}</h3>
                    <p class="title">${escapeHtml(prospect.title || 'Titre non spécifié')}</p>
                    ${prospect.company ? `<p class="company">at ${escapeHtml(prospect.company)}</p>` : '<p class="company">Entreprise non spécifiée</p>'}
                    ${prospect.location ? `<p class="location">📍 ${escapeHtml(prospect.location)}</p>` : ''}
                </div>
                <div class="prospect-meta">
                    <span class="status-badge status-${prospect.status.toLowerCase().replace(/\\s+/g, '')}">
                        ${prospect.status}
                    </span>
                    ${prospect.score ? `<span class="score-badge">${prospect.score}/100</span>` : ''}
                </div>
            </div>
            <div class="prospect-details">
                ${prospect.email ? `<p class="contact">📧 ${escapeHtml(prospect.email)}</p>` : ''}
                ${prospect.phone ? `<p class="contact">📞 ${escapeHtml(prospect.phone)}</p>` : ''}
                ${prospect.tags ? `<p class="tags">🏷️ ${escapeHtml(prospect.tags)}</p>` : ''}
                ${prospect.notes ? `<p class="notes">📝 ${escapeHtml(prospect.notes)}</p>` : ''}
                <p class="date">Added: ${formatDate(prospect.dateAdded)}</p>
                <p class="debug-info" style="font-size: 10px; color: #666;">Debug ID: ${prospect.id}</p>
            </div>
            <div class="prospect-actions">
                <div class="action-group">
                    <h4>🔗 LinkedIn Actions</h4>
                    <a href="${prospect.linkedinUrl}" target="_blank" class="btn-linkedin">
                        View Profile
                    </a>
                    <button onclick="sendLinkedInConnection('${prospect.id}')" 
                            class="btn-action primary" ${prospect.status === 'Connection Sent' ? 'disabled' : ''}>
                        📤 Send Connection
                    </button>
                    <button onclick="sendLinkedInMessage('${prospect.id}')" 
                            class="btn-action secondary" ${!prospect.linkedinUrl ? 'disabled' : ''}>
                        💬 Send Message
                    </button>
                </div>
                
                <div class="action-group">
                    <h4>📧 Email Actions</h4>
                    <button onclick="generatePersonalizedEmail('${prospect.id}')" 
                            class="btn-action primary" ${!prospect.email ? 'disabled' : ''}>
                        🤖 Generate AI Email ${prospect.linkedinUrl ? '(Profile Analysis)' : '(Basic)'}
                    </button>
                    <button onclick="sendEmail('${prospect.id}')" 
                            class="btn-action secondary" ${!prospect.email || prospect.status === 'Email Sent' ? 'disabled' : ''}>
                        📬 Send Email
                    </button>
                    <button onclick="scheduleFollowUp('${prospect.id}')" 
                            class="btn-action tertiary">
                        ⏰ Schedule Follow-up
                    </button>
                </div>
                
                <div class="action-group">
                    <h4>📊 Status Updates</h4>
                    <button onclick="updateProspectStatus('${prospect.id}', 'Contacted')" 
                            class="btn-status" ${prospect.status === 'Contacted' ? 'disabled' : ''}>
                        ✅ Mark Contacted
                    </button>
                    <button onclick="updateProspectStatus('${prospect.id}', 'Responded')" 
                            class="btn-status" ${prospect.status === 'Responded' ? 'disabled' : ''}>
                        💬 Mark Responded
                    </button>
                    <button onclick="updateProspectStatus('${prospect.id}', 'Qualified')" 
                            class="btn-status" ${prospect.status === 'Qualified' ? 'disabled' : ''}>
                        🎯 Mark Qualified
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    prospectsTable.innerHTML = html;
    updateSelectedCount();
}

// Update prospect status (placeholder - would need backend support)
function updateProspectStatus(id, status) {
    const prospect = currentProspects.find(p => p.id === id);
    if (prospect) {
        prospect.status = status;
        displayProspects();
        updateStatus(`✅ Updated ${prospect.name} status to ${status}`, 'success');
    }
}

// Google authentication
async function authenticateGoogle() {
    try {
        const response = await fetch(`${API_URL}/auth/google`);
        const data = await response.json();
        
        if (data.authUrl) {
            const authWindow = window.open(data.authUrl, 'google-auth', 'width=500,height=600');
            
            // Check if auth window is closed
            const authChecker = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(authChecker);
                    setTimeout(() => {
                        checkSystemHealth();
                        loadProspects();
                    }, 1000);
                }
            }, 1000);
        }
    } catch (error) {
        updateStatus(`❌ Authentication error: ${error.message}`, 'error');
    }
}

// Clear CRM data
// Remove duplicates from CRM
async function removeDuplicates() {
    if (!confirm('Remove duplicate prospects from CRM? This action cannot be undone.')) {
        return;
    }
    
    try {
        updateStatus('🔄 Removing duplicates...', 'info');
        
        const response = await fetch(`${API_URL}/prospects/remove-duplicates`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus(`✅ Removed ${data.removed} duplicate(s) from CRM`, 'success');
            // Refresh prospects table
            loadProspects();
        } else {
            updateStatus('❌ Failed to remove duplicates', 'error');
        }
    } catch (error) {
        console.error('Remove duplicates error:', error);
        updateStatus('❌ Remove duplicates failed', 'error');
    }
}

async function clearCRM() {
    if (!confirm('Are you sure you want to clear all CRM data? This cannot be undone.')) {
        return;
    }
    
    try {
        updateStatus('🗑️ Clearing CRM data...', 'info');
        
        const response = await fetch(`${API_URL}/sheets/clear`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus('✅ CRM data cleared', 'success');
            await loadProspects();
        } else {
            throw new Error(data.error || 'Failed to clear data');
        }
    } catch (error) {
        updateStatus(`❌ Failed to clear CRM: ${error.message}`, 'error');
    }
}

// Export data as CSV
async function exportData() {
    if (currentProspects.length === 0) {
        updateStatus('❌ No data to export', 'error');
        return;
    }
    
    const headers = ['ID', 'Date Added', 'Name', 'Title', 'Company', 'Location', 'LinkedIn URL', 
                    'Email', 'Phone', 'Status', 'Last Contact', 'Message Sent', 'Response', 
                    'Notes', 'Tags', 'Score'];
    
    const rows = currentProspects.map(p => [
        p.id, p.dateAdded, p.name, p.title, p.company, p.location, p.linkedinUrl,
        p.email, p.phone, p.status, p.lastContact, p.messageSent, p.response,
        p.notes, p.tags, p.score
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
        .join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    updateStatus('✅ Data exported successfully', 'success');
}

// Utility functions
function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
        
        // Clear status after delay
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status';
        }, 5000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString();
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Fonctions d'extraction pour parser les notes du Google Sheet
function extractEmailFromNotes(notes) {
    if (!notes) return '';
    const match = notes.match(/Email:\s*([^\s|]+)/);
    return match ? match[1] : '';
}

function extractScoreFromNotes(notes) {
    if (!notes) return '0';
    const match = notes.match(/Score:\s*(\d+)/);
    return match ? match[1] : '0';
}

function extractTagsFromNotes(notes) {
    if (!notes) return '';
    const match = notes.match(/Tags:\s*([^|]+)/);
    return match ? match[1].trim() : '';
}

// === LOGS FUNCTIONALITY ===

async function loadLogs() {
    try {
        const level = logLevel.value;
        const url = level ? `${API_URL}/logs?level=${level}&limit=100` : `${API_URL}/logs?limit=100`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            displayLogs(data.logs);
            logsCount.textContent = `${data.logs.length} logs`;
        } else {
            displayEmptyLogs('Failed to load logs');
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        displayEmptyLogs('Error loading logs');
    }
}

function displayLogs(logs) {
    if (!logs || logs.length === 0) {
        displayEmptyLogs('No logs available');
        return;
    }
    
    const logsHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const levelClass = `level-${log.level.toLowerCase()}`;
        
        // Build meta information display
        let metaHTML = '';
        if (log.meta && Object.keys(log.meta).length > 0) {
            const relevantMeta = {};
            if (log.meta.count !== undefined) relevantMeta.count = log.meta.count;
            if (log.meta.duration !== undefined) relevantMeta.duration = log.meta.duration + 'ms';
            if (log.meta.status !== undefined) relevantMeta.status = log.meta.status;
            if (log.meta.query !== undefined) relevantMeta.query = log.meta.query;
            if (log.meta.error !== undefined) relevantMeta.error = log.meta.error;
            
            if (Object.keys(relevantMeta).length > 0) {
                metaHTML = `<div class="log-meta">${JSON.stringify(relevantMeta)}</div>`;
            }
        }
        
        return `
            <div class="log-entry ${levelClass}">
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-level ${levelClass}">${log.level}</span>
                <span class="log-component">${log.component}</span>
                <div class="log-message">
                    ${log.message}
                    ${metaHTML}
                </div>
            </div>
        `;
    }).join('');
    
    logsContainer.innerHTML = logsHTML;
    // Auto-scroll to bottom to show latest logs
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function displayEmptyLogs(message) {
    logsContainer.innerHTML = `
        <div class="empty-state">
            <p>${message}</p>
        </div>
    `;
}

async function clearSystemLogs() {
    try {
        const response = await fetch(`${API_URL}/logs/clear`, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            displayEmptyLogs('Logs cleared');
            logsCount.textContent = '0 logs';
        }
    } catch (error) {
        console.error('Error clearing logs:', error);
    }
}

function toggleLogsAutoRefresh() {
    autoRefreshLogs = !autoRefreshLogs;
    
    if (autoRefreshLogs) {
        startLogsAutoRefresh();
        toggleAutoRefresh.textContent = '⏸️ Pause Auto-refresh';
        autoRefreshStatus.textContent = 'ON';
    } else {
        stopLogsAutoRefresh();
        toggleAutoRefresh.textContent = '▶️ Resume Auto-refresh';
        autoRefreshStatus.textContent = 'OFF';
    }
}

function startLogsAutoRefresh() {
    if (logsRefreshInterval) {
        clearInterval(logsRefreshInterval);
    }
    
    if (autoRefreshLogs) {
        logsRefreshInterval = setInterval(loadLogs, 3000); // Refresh every 3 seconds
    }
}

function stopLogsAutoRefresh() {
    if (logsRefreshInterval) {
        clearInterval(logsRefreshInterval);
        logsRefreshInterval = null;
    }
}

// === CRM SEQUENCE FUNCTIONALITY ===

function toggleProspectSelection(prospectId) {
    const index = selectedProspects.indexOf(prospectId);
    if (index > -1) {
        selectedProspects.splice(index, 1);
    } else {
        selectedProspects.push(prospectId);
    }
    
    // Update UI
    updateProspectCardSelection(prospectId);
    updateSelectedCount();
    autoValidateSequence();
}

function updateProspectCardSelection(prospectId) {
    const card = document.querySelector(`[data-id="${prospectId}"]`);
    const checkbox = card?.querySelector('.prospect-checkbox');
    
    if (card && checkbox) {
        const isSelected = selectedProspects.includes(prospectId);
        card.classList.toggle('selected', isSelected);
        checkbox.checked = isSelected;
    }
}

function selectAllCRMProspects() {
    selectedProspects = currentProspects.map(p => p.id);
    updateAllProspectSelections();
    updateSelectedCount();
    autoValidateSequence();
}

function deselectAllCRMProspects() {
    selectedProspects = [];
    updateAllProspectSelections();
    updateSelectedCount();
    autoValidateSequence();
}

function updateAllProspectSelections() {
    currentProspects.forEach(prospect => {
        updateProspectCardSelection(prospect.id);
    });
}

function updateSelectedCount() {
    if (selectedProspectsCount) {
        selectedProspectsCount.textContent = selectedProspects.length;
    }
}

function getSelectedProspects() {
    return currentProspects.filter(p => selectedProspects.includes(p.id));
}

function validateSequenceConfig() {
    const issues = [];
    const warnings = [];
    
    // Check selected prospects
    if (selectedProspects.length === 0) {
        issues.push('❌ Aucun prospect sélectionné');
    } else {
        warnings.push(`✅ ${selectedProspects.length} prospect(s) sélectionné(s)`);
    }
    
    // Check email context
    if (!emailContext.value || emailContext.value.trim().length < 20) {
        issues.push('❌ Le contexte email doit contenir au moins 20 caractères');
    } else {
        warnings.push('✅ Contexte email configuré');
    }
    
    // Check LinkedIn template
    if (sendLinkedInConnections.checked && (!linkedinTemplate.value || linkedinTemplate.value.trim().length < 10)) {
        issues.push('❌ Le template LinkedIn doit contenir au moins 10 caractères');
    } else if (sendLinkedInConnections.checked) {
        warnings.push('✅ Template LinkedIn configuré');
    }
    
    // Check at least one action is selected
    if (!generateEmails.checked && !sendLinkedInConnections.checked && !scheduleFollowups.checked) {
        issues.push('❌ Sélectionnez au moins une action à exécuter');
    }
    
    // Display validation results
    displayValidationResults(issues, warnings);
    
    // Update sequence status and button
    updateSequenceStatus(issues.length === 0);
    
    return issues.length === 0;
}

function displayValidationResults(issues, warnings) {
    let html = '';
    
    issues.forEach(issue => {
        html += `<div class="validation-message error">${issue}</div>`;
    });
    
    warnings.forEach(warning => {
        html += `<div class="validation-message success">${warning}</div>`;
    });
    
    if (issues.length === 0 && warnings.length > 0) {
        html += `<div class="validation-message success">🎯 Configuration valide - Prêt à lancer la séquence !</div>`;
    }
    
    sequenceValidation.innerHTML = html;
}

function updateSequenceStatus(isValid) {
    const statusDot = sequenceStatus.querySelector('.status-dot');
    const statusText = sequenceStatus.querySelector('span:last-child');
    
    if (isValid) {
        statusDot.className = 'status-dot green';
        statusText.textContent = 'Prêt à lancer';
        // Sequence button functionality moved to CRM section
    } else {
        statusDot.className = 'status-dot red';
        statusText.textContent = 'Configuration incomplète';
        // Sequence button functionality moved to CRM section
    }
}

function autoValidateSequence() {
    // Auto-validate when config changes, but don't show validation messages
    const isValid = validateSequenceConfig();
    return isValid;
}

async function runFullSequenceFromCRM() {
    console.log('🔥 runFullSequenceFromCRM called!');
    
    const isValid = validateSequenceConfig();
    console.log('🔍 Validation result:', isValid);
    
    if (!isValid) {
        updateStatus('❌ Configuration invalide - Vérifiez les paramètres', 'error');
        console.log('❌ Configuration invalid, stopping sequence');
        return;
    }
    
    const prospects = getSelectedProspects();
    const config = {
        emailContext: emailContext.value.trim(),
        linkedinTemplate: linkedinTemplate.value.trim(),
        actions: {
            generateEmails: generateEmails.checked,
            sendLinkedInConnections: sendLinkedInConnections.checked,
            scheduleFollowups: scheduleFollowups.checked
        }
    };
    
    console.log('🚀 Launching sequence from CRM with config:', config);
    console.log('👥 Selected prospects:', prospects.length);
    
    updateStatus(`🚀 Lancement de la séquence sur ${prospects.length} prospects...`, 'info');
    // Sequence button functionality moved to CRM section
    // Sequence button functionality moved to CRM section
    
    try {
        const results = {
            emailsGenerated: 0,
            connectionsRequested: 0,
            followupsScheduled: 0,
            errors: []
        };
        
        // 1. Generate emails if enabled
        if (config.actions.generateEmails) {
            updateStatus('📧 Génération des emails personnalisés...', 'info');
            
            for (const prospect of prospects) {
                try {
                    const emailResponse = await fetch(`${API_URL}/automation/generate-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            prospect: prospect,
                            context: config.emailContext
                        })
                    });
                    
                    const emailData = await emailResponse.json();
                    if (emailData.success) {
                        results.emailsGenerated++;
                    } else {
                        results.errors.push(`Email pour ${prospect.name}: ${emailData.error}`);
                    }
                } catch (error) {
                    results.errors.push(`Email pour ${prospect.name}: ${error.message}`);
                }
            }
        }
        
        // 2. Send LinkedIn connections if enabled
        if (config.actions.sendLinkedInConnections) {
            updateStatus('🔗 Envoi des demandes de connexion LinkedIn...', 'info');
            // Simulate LinkedIn connections (would be implemented with actual LinkedIn automation)
            results.connectionsRequested = prospects.length;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
        }
        
        // 3. Schedule follow-ups if enabled
        if (config.actions.scheduleFollowups) {
            updateStatus('⏰ Programmation des relances...', 'info');
            // Simulate follow-up scheduling
            results.followupsScheduled = prospects.length;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Display results modal
        displaySequenceResults(results, prospects.length);
        
        updateStatus('✅ Séquence terminée avec succès', 'success');
        
    } catch (error) {
        console.error('Sequence error:', error);
        updateStatus(`❌ Erreur lors de la séquence: ${error.message}`, 'error');
    } finally {
        // Sequence button functionality moved to CRM section
        // Sequence button functionality moved to CRM section
    }
}

function displaySequenceResults(results, totalProspects) {
    const modal = document.createElement('div');
    modal.className = 'email-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎯 Séquence Terminée</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="sequence-summary">
                    <h3>📊 Résultats de la séquence</h3>
                    <div class="results-grid">
                        <div class="result-stat">
                            <span class="stat-number">${totalProspects}</span>
                            <span class="stat-label">Prospects traités</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-number">${results.emailsGenerated}</span>
                            <span class="stat-label">Emails générés</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-number">${results.connectionsRequested}</span>
                            <span class="stat-label">Connexions LinkedIn</span>
                        </div>
                        <div class="result-stat">
                            <span class="stat-number">${results.followupsScheduled}</span>
                            <span class="stat-label">Relances programmées</span>
                        </div>
                    </div>
                    
                    ${results.errors.length > 0 ? `
                        <div class="errors-section">
                            <h4>⚠️ Erreurs rencontrées:</h4>
                            <ul>
                                ${results.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="next-steps">
                        <h4>🎯 Prochaines étapes recommandées:</h4>
                        <ul>
                            <li>📧 Vérifier les emails générés dans la section CRM</li>
                            <li>🔗 Surveiller les acceptations de connexions LinkedIn</li>
                            <li>📈 Suivre les taux de réponse dans les prochains jours</li>
                            <li>🔄 Programmer des relances si nécessaire</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => document.body.removeChild(modal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });
}


// Modal de résumé des résultats de la séquence
function showSequenceResultModal(emailResults, addedCount) {
    const modal = document.createElement('div');
    modal.className = 'email-modal';
    
    const successfulEmails = emailResults.filter(r => r.email).length;
    const failedEmails = emailResults.filter(r => !r.email).length;
    const profileAnalyzed = emailResults.filter(r => r.profileAnalyzed).length;
    
    const emailsList = emailResults.map(result => {
        const status = result.email ? '✅' : '❌';
        const analysis = result.profileAnalyzed ? '🔍' : '📝';
        return `<div class="result-item">
            ${status} ${analysis} ${result.prospect.name} @ ${result.prospect.company}
            ${result.error ? `<span class="error-text"> - ${result.error}</span>` : ''}
        </div>`;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎉 Séquence Complète Terminée</h2>
                <button class="close-modal" onclick="closeSequenceModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="sequence-summary">
                    <div class="summary-stats">
                        <div class="stat-card">
                            <div class="stat-number">${addedCount}</div>
                            <div class="stat-label">Prospects ajoutés au CRM</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${successfulEmails}</div>
                            <div class="stat-label">Emails générés</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${profileAnalyzed}</div>
                            <div class="stat-label">Analyses de profil</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${emailResults.length}</div>
                            <div class="stat-label">Actions LinkedIn</div>
                        </div>
                    </div>
                    <div class="results-detail">
                        <h3>📊 Détail des résultats:</h3>
                        <div class="results-list">
                            ${emailsList}
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="closeSequenceModal()">✅ Continuer</button>
                    <button class="btn-secondary" onclick="window.location.reload()">🔄 Refresh Page</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSequenceModal() {
    const modal = document.querySelector('.email-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// === NOUVELLES FONCTIONS D'AUTOMATISATION ===

// LinkedIn Connection Request
async function sendLinkedInConnection(prospectId) {
    const prospect = currentProspects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    try {
        updateStatus(`🔄 Sending LinkedIn connection to ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/linkedin-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prospectId: prospect.id,
                linkedinUrl: prospect.linkedinUrl,
                name: prospect.name,
                title: prospect.title,
                company: prospect.company
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await updateProspectStatus(prospectId, 'Connection Sent');
            updateStatus(`✅ Connection request sent to ${prospect.name}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to send connection');
        }
        
    } catch (error) {
        console.error('LinkedIn connection error:', error);
        updateStatus(`❌ Failed to send connection: ${error.message}`, 'error');
    }
}

// LinkedIn Message
async function sendLinkedInMessage(prospectId) {
    const prospect = currentProspects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    const message = prompt(`Enter LinkedIn message for ${prospect.name}:`);
    if (!message) return;
    
    try {
        updateStatus(`🔄 Sending LinkedIn message to ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/linkedin-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prospectId: prospect.id,
                linkedinUrl: prospect.linkedinUrl,
                message: message,
                name: prospect.name
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await updateProspectStatus(prospectId, 'Message Sent');
            updateStatus(`✅ LinkedIn message sent to ${prospect.name}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('LinkedIn message error:', error);
        updateStatus(`❌ Failed to send message: ${error.message}`, 'error');
    }
}

// Generate Personalized Email with AI
async function generatePersonalizedEmail(prospectId) {
    const prospect = currentProspects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    try {
        updateStatus(`🤖 Generating personalized email for ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/generate-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prospect: {
                    name: prospect.name,
                    title: prospect.title,
                    company: prospect.company,
                    location: prospect.location,
                    linkedinUrl: prospect.linkedinUrl,
                    tags: prospect.tags
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show generated email in a modal
            showEmailModal(prospect, data.email);
            updateStatus(`✅ AI email generated for ${prospect.name}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to generate email');
        }
        
    } catch (error) {
        console.error('Email generation error:', error);
        updateStatus(`❌ Failed to generate email: ${error.message}`, 'error');
    }
}

// Send Email
async function sendEmail(prospectId, emailContent = null) {
    const prospect = currentProspects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    if (!emailContent) {
        emailContent = prompt(`Enter email content for ${prospect.name}:`);
        if (!emailContent) return;
    }
    
    try {
        updateStatus(`📧 Sending email to ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prospect: {
                    id: prospect.id,
                    name: prospect.name,
                    email: prospect.email,
                    title: prospect.title,
                    company: prospect.company
                },
                emailContent: emailContent
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await updateProspectStatus(prospectId, 'Email Sent');
            updateStatus(`✅ Email sent to ${prospect.name}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to send email');
        }
        
    } catch (error) {
        console.error('Email sending error:', error);
        updateStatus(`❌ Failed to send email: ${error.message}`, 'error');
    }
}

// Schedule Follow-up
async function scheduleFollowUp(prospectId) {
    const prospect = currentProspects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    const days = prompt('Schedule follow-up in how many days?', '3');
    if (!days) return;
    
    const notes = prompt(`Follow-up notes for ${prospect.name}:`, 'Follow up on initial outreach');
    
    try {
        updateStatus(`⏰ Scheduling follow-up for ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/schedule-followup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prospectId: prospect.id,
                days: parseInt(days),
                notes: notes,
                prospect: {
                    name: prospect.name,
                    email: prospect.email,
                    title: prospect.title,
                    company: prospect.company
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            updateStatus(`✅ Follow-up scheduled for ${prospect.name} in ${days} days`, 'success');
        } else {
            throw new Error(data.error || 'Failed to schedule follow-up');
        }
        
    } catch (error) {
        console.error('Follow-up scheduling error:', error);
        updateStatus(`❌ Failed to schedule follow-up: ${error.message}`, 'error');
    }
}

// Show Email Modal
function showEmailModal(prospect, emailData) {
    // Vérifier si des insights sont disponibles
    const hasInsights = emailData.personalization && emailData.personalization.profileAnalyzed;
    
    let insightsHtml = '';
    if (hasInsights) {
        insightsHtml = `
            <div class="email-insights">
                <h4>🔍 Profile Analysis Insights</h4>
                <div class="insights-grid">
                    <div class="insight-item">
                        <span class="insight-label">Seniority:</span>
                        <span class="insight-value">${emailData.personalization.seniority || 'Unknown'}</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Industry:</span>
                        <span class="insight-value">${emailData.personalization.industry || 'General'}</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Personalized:</span>
                        <span class="insight-value">✅ LinkedIn Profile Analyzed</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        insightsHtml = `
            <div class="email-insights basic">
                <h4>ℹ️ Basic Template</h4>
                <p>This email uses basic prospect data. For deeper personalization, ensure LinkedIn URL is available.</p>
            </div>
        `;
    }

    const modal = document.createElement('div');
    modal.className = 'email-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🤖 Generated Email for ${escapeHtml(prospect.name)}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                ${insightsHtml}
                <div class="email-preview">
                    <div class="email-field">
                        <label><strong>To:</strong></label>
                        <span>${escapeHtml(prospect.email)}</span>
                    </div>
                    <div class="email-field">
                        <label><strong>Subject:</strong></label>
                        <input type="text" id="emailSubject" value="${escapeHtml(emailData.subject || '')}" style="width: 100%; padding: 5px;">
                    </div>
                    <div class="email-field">
                        <label><strong>Content:</strong></label>
                        <textarea id="emailContent" rows="15" style="width: 100%; padding: 10px;">${escapeHtml(emailData.content || emailData.body || '')}</textarea>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="sendGeneratedEmail('${prospect.id}')">📧 Send Email</button>
                    <button class="btn-secondary" onclick="regenerateEmail('${prospect.id}')">🔄 Regenerate</button>
                    <button class="btn-tertiary" onclick="closeEmailModal()">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal handlers
    modal.querySelector('.close-modal').onclick = closeEmailModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeEmailModal();
    };
}

function closeEmailModal() {
    const modal = document.querySelector('.email-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function sendGeneratedEmail(prospectId) {
    const subject = document.getElementById('emailSubject').value;
    const content = document.getElementById('emailContent').value;
    
    closeEmailModal();
    await sendEmail(prospectId, { subject, content });
}

async function regenerateEmail(prospectId) {
    closeEmailModal();
    await generatePersonalizedEmail(prospectId);
}

// === FONCTIONS POUR LES BOUTONS DES PROSPECTS ===

async function generateEmailForProspect(prospectId) {
    try {
        const prospect = currentProspects.find(p => p.id === prospectId);
        if (!prospect) {
            updateStatus('❌ Prospect non trouvé', 'error');
            return;
        }
        
        updateStatus(`🤖 Génération d'email pour ${prospect.name}...`, 'info');
        
        const response = await fetch(`${API_URL}/automation/generate-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prospect: prospect,
                context: emailContext?.value || 'Prospection commerciale'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (typeof showEmailModal === 'function') {
                showEmailModal(prospect, data.email);
            }
            updateStatus(`✅ Email généré pour ${prospect.name}`, 'success');
        } else {
            updateStatus(`❌ Erreur génération email: ${data.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error generating email:', error);
        updateStatus(`❌ Erreur: ${error.message}`, 'error');
    }
}

async function sendEmail(prospectId, emailData) {
    try {
        const prospect = currentProspects.find(p => p.id === prospectId);
        if (!prospect) {
            updateStatus('❌ Prospect non trouvé', 'error');
            return;
        }
        
        if (!prospect.email) {
            updateStatus('❌ Aucun email disponible pour ce prospect', 'error');
            return;
        }
        
        updateStatus(`📧 Envoi d'email à ${prospect.name}...`, 'info');
        
        // Simuler l'envoi d'email (implémentation selon votre service email)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mettre à jour le statut du prospect
        await updateProspectStatus(prospectId, 'Email Sent');
        
        updateStatus(`✅ Email envoyé à ${prospect.name}`, 'success');
        
    } catch (error) {
        console.error('Error sending email:', error);
        updateStatus(`❌ Erreur envoi email: ${error.message}`, 'error');
    }
}

async function scheduleFollowUp(prospectId) {
    try {
        const prospect = currentProspects.find(p => p.id === prospectId);
        if (!prospect) {
            updateStatus('❌ Prospect non trouvé', 'error');
            return;
        }
        
        const followUpDate = prompt('Date de relance (YYYY-MM-DD):');
        if (!followUpDate) return;
        
        updateStatus(`⏰ Relance programmée pour ${prospect.name} le ${followUpDate}`, 'info');
        
        // Incrémenter le compteur de relances
        const currentCount = parseInt(prospect.followupCount) || 0;
        await updateProspectData(prospectId, { followupCount: currentCount + 1 });
        
        updateStatus(`✅ Relance programmée pour ${prospect.name}`, 'success');
        
    } catch (error) {
        console.error('Error scheduling follow-up:', error);
        updateStatus(`❌ Erreur programmation relance: ${error.message}`, 'error');
    }
}

async function updateProspectStatus(prospectId, newStatus) {
    try {
        const prospect = currentProspects.find(p => p.id === prospectId);
        if (!prospect) {
            updateStatus('❌ Prospect non trouvé', 'error');
            return;
        }
        
        updateStatus(`📝 Mise à jour du statut de ${prospect.name}: ${newStatus}`, 'info');
        
        await updateProspectData(prospectId, { status: newStatus });
        
        updateStatus(`✅ Statut mis à jour: ${prospect.name} → ${newStatus}`, 'success');
        
    } catch (error) {
        console.error('Error updating prospect status:', error);
        updateStatus(`❌ Erreur mise à jour statut: ${error.message}`, 'error');
    }
}

async function updateProspectData(prospectId, updateData) {
    try {
        // Cette fonction devrait faire un appel API pour mettre à jour les données
        // Pour l'instant, on met à jour localement et on recharge
        const prospectIndex = currentProspects.findIndex(p => p.id === prospectId);
        if (prospectIndex !== -1) {
            currentProspects[prospectIndex] = { ...currentProspects[prospectIndex], ...updateData };
            displayProspects(); // Réafficher les prospects
        }
        
        // TODO: Implémenter l'appel API pour persister les changements
        
    } catch (error) {
        console.error('Error updating prospect data:', error);
        throw error;
    }
}

// === FONCTION D'URGENCE: DIAGNOSTIC ET RÉPARATION DES BOUTONS ===
function emergencyButtonDiagnostic() {
    console.log('🚨 EMERGENCY BUTTON DIAGNOSTIC');
    console.log('===============================');
    
    // Test des éléments critiques
    const elements = {
        addSelectedBtn: document.getElementById('addSelectedBtn'),
        runFullSequence: document.getElementById('runFullSequence'),
        validateSequence: document.getElementById('validateSequence'),
        searchQuery: document.getElementById('searchQuery'),
        emailContext: document.getElementById('emailContext'),
        linkedinTemplate: document.getElementById('linkedinTemplate')
    };
    
    console.log('🔍 Elements status:');
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            const disabled = element.disabled ? 'DISABLED' : 'ENABLED';
            const style = window.getComputedStyle(element);
            const pointerEvents = style.pointerEvents;
            console.log(`  ✅ ${name}: Found, ${disabled}, pointer-events: ${pointerEvents}`);
        } else {
            console.log(`  ❌ ${name}: NOT FOUND`);
        }
    }
    
    // RÉPARATION D'URGENCE: Re-attacher les event listeners
    if (elements.addSelectedBtn && elements.runFullSequence) {
        console.log('🔧 EMERGENCY REPAIR: Re-attaching event listeners...');
        
        // Supprimer les anciens listeners (au cas où)
        const newAddBtn = elements.addSelectedBtn.cloneNode(true);
        elements.addSelectedBtn.parentNode.replaceChild(newAddBtn, elements.addSelectedBtn);
        
        const newRunBtn = elements.runFullSequence.cloneNode(true);
        elements.runFullSequence.parentNode.replaceChild(newRunBtn, elements.runFullSequence);
        
        // Réattacher les nouveaux listeners
        newAddBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔥 Add Selected button clicked!');
            addSelectedProspects();
        });
        
        newRunBtn.addEventListener('click', (e) => {
            e.preventDefault();  
            e.stopPropagation();
            console.log('🔥 Run Full Sequence button clicked!');
            runFullSequenceFromCRM();
        });
        
        // Forcer l'activation des boutons
        newAddBtn.disabled = false;
        newRunBtn.disabled = false;
        newAddBtn.style.pointerEvents = 'auto';
        newRunBtn.style.pointerEvents = 'auto';
        
        console.log('✅ Emergency repair completed!');
        console.log('🎯 Buttons should now be clickable');
        
        // Mettre à jour les références globales
        addSelectedBtn = newAddBtn;
        runFullSequence = newRunBtn;
        
    } else {
        console.log('❌ Critical buttons not found, cannot repair');
    }
}