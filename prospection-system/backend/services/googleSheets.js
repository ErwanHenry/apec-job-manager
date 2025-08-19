const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.drive = null;
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  }

  async initialize() {
    try {
      // Check if credentials exist
      try {
        await fs.access(CREDENTIALS_PATH);
      } catch (error) {
        console.error('❌ credentials.json not found. Please add your Google OAuth credentials.');
        console.log('📝 Create credentials at: https://console.cloud.google.com/apis/credentials');
        return false;
      }

      const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      
      if (!client_secret || !client_id || !redirect_uris) {
        console.error('❌ Invalid credentials.json format');
        return false;
      }
      
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Check for existing token
      try {
        const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
        this.auth.setCredentials(token);
        
        // Test if token is still valid
        await this.auth.getAccessToken();
        
        // Test spreadsheet access
        if (this.spreadsheetId) {
          this.sheets = google.sheets({ version: 'v4', auth: this.auth });
          await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
        }
      } catch (error) {
        console.log('⚠️ Token not found or expired. Please authenticate via /api/auth/google');
        return false;
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      console.log('✅ Google Sheets service initialized');
      console.log('📊 Spreadsheet ID:', this.spreadsheetId);
      return true;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error.message);
      return false;
    }
  }

  async getAuthUrl() {
    const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    return oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  async saveToken(code) {
    try {
      const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf8'));
      const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
      
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
      const { tokens } = await oAuth2Client.getToken(code);
      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
      
      console.log('✅ Token saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  }

  async getSheetData(range = 'A:Z') {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  async appendToSheet(values, range = 'A:Z') {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: Array.isArray(values[0]) ? values : [values],
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error appending to sheet:', error);
      throw error;
    }
  }

  async updateCell(range, value) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[value]],
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cell:', error);
      throw error;
    }
  }

  async clearSheet(range = 'A2:Z1000') {
    try {
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range,
      });
      console.log('✅ Sheet cleared');
    } catch (error) {
      console.error('Error clearing sheet:', error);
      throw error;
    }
  }

  async validateSpreadsheet() {
    try {
      if (!this.spreadsheetId) {
        throw new Error('No spreadsheet ID configured');
      }
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      
      console.log('✅ Spreadsheet found:', response.data.properties.title);
      return true;
    } catch (error) {
      console.error('❌ Spreadsheet validation failed:', error.message);
      if (error.code === 404) {
        console.log('📝 Create a new spreadsheet or check the ID in .env');
      }
      return false;
    }
  }

  async setupHeaders() {
    const headers = [
      'ID',
      'Nom',
      'Entreprise',
      'Poste',
      'LinkedIn URL',
      'Localisation',
      'Date d\'ajout',
      'Statut',
      'Message envoyé',
      'Nb relances',
      'Notes'
    ];

    try {
      // Validate spreadsheet first
      const isValid = await this.validateSpreadsheet();
      if (!isValid) {
        throw new Error('Invalid spreadsheet');
      }
      
      // Check if headers exist
      const currentData = await this.getSheetData('A1:K1');
      if (!currentData.length || currentData[0].length === 0) {
        await this.appendToSheet([headers], 'A1');
        console.log('✅ Headers created');
      } else {
        console.log('✅ Headers already exist');
      }
    } catch (error) {
      console.error('Error setting up headers:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
