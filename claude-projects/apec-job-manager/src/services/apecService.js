const puppeteer = require('puppeteer');
const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ApecService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isAuthenticated = false;
  }

  /**
   * Initialize browser and authenticate
   */
  async initialize() {
    try {
      logger.info('Initializing APEC browser session...');

      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      await this.authenticate();
      logger.info('APEC session initialized successfully');

      return true;
    } catch (error) {
      logger.error('Failed to initialize APEC session:', error);
      throw error;
    }
  }

  /**
   * Authenticate on APEC
   */
  async authenticate() {
    try {
      logger.info('Authenticating on APEC.FR...');

      // Navigate to APEC login page
      await this.page.goto('https://entreprise.apec.fr/accueil', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill credentials
      await this.page.type('input[type="email"]', process.env.APEC_EMAIL);
      await this.page.type('input[type="password"]', process.env.APEC_PASSWORD);

      // Submit form
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);

      // Verify authentication
      const isLoggedIn = await this.page.evaluate(() => {
        return document.querySelector('.user-menu') !== null;
      });

      if (!isLoggedIn) {
        throw new Error('Authentication failed');
      }

      this.isAuthenticated = true;
      logger.info('Successfully authenticated on APEC');

      return true;
    } catch (error) {
      logger.error('APEC authentication error:', error);
      throw error;
    }
  }

  /**
   * Create a new job posting
   */
  async createJobPosting(jobData) {
    try {
      if (!this.isAuthenticated) {
        await this.initialize();
      }

      logger.info(`Creating job posting: ${jobData.title}`);

      // Navigate to job creation page
      await this.page.goto('https://entreprise.apec.fr/deposer-une-offre', {
        waitUntil: 'networkidle2'
      });

      // Fill job form
      await this.fillJobForm(jobData);

      // Submit form
      await this.page.click('button[data-action="publish"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Get job ID from URL or confirmation page
      const jobId = await this.extractJobId();

      // Save to database
      const job = await prisma.job.create({
        data: {
          apecId: jobId,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          contractType: jobData.contractType,
          salary: jobData.salary,
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      logger.info(`Job created successfully: ${jobId}`);
      return job;
    } catch (error) {
      logger.error('Failed to create job posting:', error);
      throw error;
    }
  }

  /**
   * Update existing job posting
   */
  async updateJobPosting(jobId, updates) {
    try {
      if (!this.isAuthenticated) {
        await this.initialize();
      }

      logger.info(`Updating job posting: ${jobId}`);

      // Navigate to job edit page
      await this.page.goto(`https://entreprise.apec.fr/mes-offres/${jobId}/modifier`, {
        waitUntil: 'networkidle2'
      });

      // Update form fields
      await this.fillJobForm(updates, true);

      // Save changes
      await this.page.click('button[data-action="save"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Update database
      const job = await prisma.job.update({
        where: { apecId: jobId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      logger.info(`Job updated successfully: ${jobId}`);
      return job;
    } catch (error) {
      logger.error('Failed to update job posting:', error);
      throw error;
    }
  }

  /**
   * Delete job posting
   */
  async deleteJobPosting(jobId) {
    try {
      if (!this.isAuthenticated) {
        await this.initialize();
      }

      logger.info(`Deleting job posting: ${jobId}`);

      // Navigate to job page
      await this.page.goto(`https://entreprise.apec.fr/mes-offres/${jobId}`, {
        waitUntil: 'networkidle2'
      });

      // Click delete button
      await this.page.click('button[data-action="delete"]');

      // Confirm deletion
      await this.page.waitForSelector('.confirmation-modal', { timeout: 5000 });
      await this.page.click('button[data-confirm="true"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Update database
      await prisma.job.update({
        where: { apecId: jobId },
        data: {
          status: 'DELETED',
          deletedAt: new Date()
        }
      });

      logger.info(`Job deleted successfully: ${jobId}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete job posting:', error);
      throw error;
    }
  }

  /**
   * Get all job postings
   */
  async getAllJobs() {
    try {
      if (!this.isAuthenticated) {
        await this.initialize();
      }

      logger.info('Fetching all job postings from APEC...');

      await this.page.goto('https://entreprise.apec.fr/mes-offres', {
        waitUntil: 'networkidle2'
      });

      // Extract job listings
      const jobs = await this.page.evaluate(() => {
        const jobElements = document.querySelectorAll('.job-item');
        return Array.from(jobElements).map(el => ({
          id: el.getAttribute('data-job-id'),
          title: el.querySelector('.job-title')?.textContent.trim(),
          status: el.querySelector('.job-status')?.textContent.trim(),
          views: parseInt(el.querySelector('.job-views')?.textContent) || 0,
          applications: parseInt(el.querySelector('.job-applications')?.textContent) || 0,
          publishedDate: el.querySelector('.job-date')?.textContent.trim()
        }));
      });

      logger.info(`Found ${jobs.length} job postings`);
      return jobs;
    } catch (error) {
      logger.error('Failed to fetch jobs:', error);
      throw error;
    }
  }

  /**
   * Sync APEC jobs with local database
   */
  async syncJobs() {
    try {
      logger.info('Starting job synchronization...');

      const apecJobs = await this.getAllJobs();
      const dbJobs = await prisma.job.findMany({
        where: { status: { not: 'DELETED' } }
      });

      const syncReport = {
        created: 0,
        updated: 0,
        deleted: 0,
        unchanged: 0,
        errors: []
      };

      // Update existing jobs and identify new ones
      for (const apecJob of apecJobs) {
        const dbJob = dbJobs.find(j => j.apecId === apecJob.id);

        if (!dbJob) {
          // New job found on APEC
          try {
            await prisma.job.create({
              data: {
                apecId: apecJob.id,
                title: apecJob.title,
                status: apecJob.status,
                views: apecJob.views,
                applications: apecJob.applications
              }
            });
            syncReport.created++;
          } catch (error) {
            syncReport.errors.push(`Failed to create job ${apecJob.id}: ${error.message}`);
          }
        } else if (
          dbJob.views !== apecJob.views ||
          dbJob.applications !== apecJob.applications ||
          dbJob.status !== apecJob.status
        ) {
          // Update existing job
          try {
            await prisma.job.update({
              where: { id: dbJob.id },
              data: {
                status: apecJob.status,
                views: apecJob.views,
                applications: apecJob.applications,
                lastSyncAt: new Date()
              }
            });
            syncReport.updated++;
          } catch (error) {
            syncReport.errors.push(`Failed to update job ${apecJob.id}: ${error.message}`);
          }
        } else {
          syncReport.unchanged++;
        }
      }

      // Identify deleted jobs
      const apecJobIds = apecJobs.map(j => j.id);
      const deletedJobs = dbJobs.filter(j => !apecJobIds.includes(j.apecId));

      for (const job of deletedJobs) {
        try {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'DELETED',
              deletedAt: new Date()
            }
          });
          syncReport.deleted++;
        } catch (error) {
          syncReport.errors.push(`Failed to mark job ${job.apecId} as deleted: ${error.message}`);
        }
      }

      logger.info('Synchronization completed:', syncReport);
      return syncReport;
    } catch (error) {
      logger.error('Synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Helper: Fill job form
   */
  async fillJobForm(data, isUpdate = false) {
    if (data.title) {
      await this.page.waitForSelector('input[name="title"]');
      if (isUpdate) await this.page.evaluate(() => document.querySelector('input[name="title"]').value = '');
      await this.page.type('input[name="title"]', data.title);
    }

    if (data.description) {
      await this.page.waitForSelector('textarea[name="description"]');
      if (isUpdate) await this.page.evaluate(() => document.querySelector('textarea[name="description"]').value = '');
      await this.page.type('textarea[name="description"]', data.description);
    }

    if (data.location) {
      await this.page.waitForSelector('input[name="location"]');
      if (isUpdate) await this.page.evaluate(() => document.querySelector('input[name="location"]').value = '');
      await this.page.type('input[name="location"]', data.location);
    }

    if (data.contractType) {
      await this.page.select('select[name="contractType"]', data.contractType);
    }

    if (data.salary) {
      await this.page.waitForSelector('input[name="salary"]');
      if (isUpdate) await this.page.evaluate(() => document.querySelector('input[name="salary"]').value = '');
      await this.page.type('input[name="salary"]', data.salary.toString());
    }
  }

  /**
   * Helper: Extract job ID from page
   */
  async extractJobId() {
    const url = this.page.url();
    const match = url.match(/offre\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Close browser session
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.isAuthenticated = false;
      logger.info('APEC browser session closed');
    }
  }
}

module.exports = new ApecService();
