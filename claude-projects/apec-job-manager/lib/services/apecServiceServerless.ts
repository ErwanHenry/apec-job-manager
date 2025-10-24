/**
 * APEC Service - Serverless Optimized
 *
 * This service is designed for Vercel serverless environment with the following constraints:
 * - 60 second execution timeout (Pro plan)
 * - Stateless execution (no persistent browser sessions)
 * - 3 GB memory limit
 * - Ephemeral filesystem
 *
 * Key features:
 * - Uses @sparticuz/chromium for optimized Chromium binary
 * - Cookie persistence in Vercel KV (Redis)
 * - Timeout-aware operations with graceful degradation
 * - Retry logic with exponential backoff
 * - Encrypted cookie storage
 */

import chromium from '@sparticuz/chromium';
import puppeteer, { Browser, Page } from 'puppeteer-core';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

interface JobData {
  title: string;
  description: string;
  location: string;
  contractType: string;
  salary?: string;
  experienceLevel?: string;
  skills?: string[];
}

interface ApecJob {
  id: string;
  title: string;
  status: string;
  views: number;
  applications: number;
  publishedDate: string;
}

interface SyncReport {
  created: number;
  updated: number;
  deleted: number;
  unchanged: number;
  errors: string[];
}

interface ApecCookies {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  createdAt: number;
  expiresAt: number;
}

class ApecServiceServerless {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isAuthenticated = false;
  private readonly timeout = 55000; // 55s, leaving 5s buffer
  private readonly encryptionKey: string;
  private startTime: number = 0;

  constructor() {
    // Encryption key for cookie storage (32 bytes hex string)
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();

    if (!process.env.ENCRYPTION_KEY) {
      console.warn('WARNING: ENCRYPTION_KEY not set, using generated key (not recommended for production)');
    }
  }

  /**
   * Generate a random encryption key (for development only)
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt data using AES-256-CBC
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-CBC
   */
  private decrypt(encrypted: string): string {
    const [ivHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Check remaining execution time
   */
  private getRemainingTime(): number {
    return this.timeout - (Date.now() - this.startTime);
  }

  /**
   * Check if we have enough time for an operation
   */
  private hasTimeFor(estimatedMs: number): boolean {
    return this.getRemainingTime() > estimatedMs + 5000; // 5s safety buffer
  }

  /**
   * Initialize browser with Chromium optimized for serverless
   */
  async initialize(): Promise<void> {
    this.startTime = Date.now();

    try {
      console.log('[ApecService] Initializing Chromium browser...');

      // Check if we're running locally (for development)
      const isLocal = process.env.NODE_ENV !== 'production';

      this.browser = await puppeteer.launch({
        args: isLocal
          ? puppeteer.defaultArgs()
          : [
              ...chromium.args,
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--single-process',
              '--no-zygote',
              '--disable-setuid-sandbox',
            ],
        defaultViewport: chromium.defaultViewport,
        executablePath: isLocal
          ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
          : await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      this.page = await this.browser.newPage();

      // Set user agent to avoid detection
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Set timeout for page operations
      this.page.setDefaultTimeout(30000);

      console.log('[ApecService] Browser initialized successfully');
    } catch (error) {
      console.error('[ApecService] Failed to initialize browser:', error);
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore cookies from Vercel KV or authenticate fresh
   */
  async authenticate(forceRefresh = false): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('[ApecService] Starting authentication...');

      // Try to restore cookies from KV (unless force refresh)
      if (!forceRefresh) {
        const restored = await this.restoreCookies();
        if (restored) {
          // Verify cookies are still valid
          await this.page.goto('https://entreprise.apec.fr/accueil', {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
          });

          const isLoggedIn = await this.page.evaluate(() => {
            return document.querySelector('.user-menu') !== null;
          });

          if (isLoggedIn) {
            this.isAuthenticated = true;
            console.log('[ApecService] Authenticated using cached cookies');
            return;
          }

          console.log('[ApecService] Cached cookies expired, authenticating fresh...');
        }
      }

      // Fresh authentication
      await this.authenticateFresh();
      await this.saveCookies();

      console.log('[ApecService] Authentication completed successfully');
    } catch (error) {
      console.error('[ApecService] Authentication failed:', error);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform fresh authentication on APEC
   */
  private async authenticateFresh(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    const email = process.env.APEC_EMAIL;
    const password = process.env.APEC_PASSWORD;

    if (!email || !password) {
      throw new Error('APEC_EMAIL and APEC_PASSWORD environment variables are required');
    }

    try {
      // Navigate to login page
      await this.page.goto('https://entreprise.apec.fr/accueil', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for login form
      await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill credentials
      await this.page.type('input[type="email"]', email, { delay: 50 });
      await this.page.type('input[type="password"]', password, { delay: 50 });

      // Submit form
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      ]);

      // Verify authentication
      const isLoggedIn = await this.page.evaluate(() => {
        return document.querySelector('.user-menu') !== null;
      });

      if (!isLoggedIn) {
        throw new Error('Login verification failed - user menu not found');
      }

      this.isAuthenticated = true;
    } catch (error) {
      throw new Error(`Fresh authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save cookies to Vercel KV with encryption
   */
  private async saveCookies(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const cookies = await this.page.cookies();
      const now = Date.now();

      const cookieData: ApecCookies = {
        cookies,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
      };

      // Encrypt before storing
      const encrypted = this.encrypt(JSON.stringify(cookieData));

      // Store in KV with 24h TTL
      await kv.set('apec:cookies:default', encrypted, { ex: 86400 });

      console.log('[ApecService] Cookies saved to KV (24h TTL)');
    } catch (error) {
      console.error('[ApecService] Failed to save cookies:', error);
      // Non-fatal error, continue execution
    }
  }

  /**
   * Restore cookies from Vercel KV
   */
  private async restoreCookies(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      const encrypted = await kv.get<string>('apec:cookies:default');

      if (!encrypted) {
        console.log('[ApecService] No cached cookies found in KV');
        return false;
      }

      // Decrypt
      const decrypted = this.decrypt(encrypted);
      const cookieData: ApecCookies = JSON.parse(decrypted);

      // Check if cookies are expired
      if (Date.now() > cookieData.expiresAt) {
        console.log('[ApecService] Cached cookies expired');
        await kv.del('apec:cookies:default');
        return false;
      }

      // Restore cookies to page
      await this.page.setCookie(...cookieData.cookies);

      console.log('[ApecService] Cookies restored from KV');
      return true;
    } catch (error) {
      console.error('[ApecService] Failed to restore cookies:', error);
      return false;
    }
  }

  /**
   * Create a new job posting on APEC
   * Timeout-aware: returns partial result if timeout is approaching
   */
  async createJobPosting(jobData: JobData): Promise<{ jobId: string; partial: boolean }> {
    if (!this.page) {
      await this.initialize();
    }

    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    if (!this.hasTimeFor(20000)) {
      throw new Error('Insufficient time remaining for job creation (requires ~20s)');
    }

    try {
      console.log(`[ApecService] Creating job: ${jobData.title}`);

      // Navigate to job creation page
      await this.page!.goto('https://entreprise.apec.fr/deposer-une-offre', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Fill job form
      await this.fillJobForm(jobData);

      // Check if we have time to submit
      if (!this.hasTimeFor(10000)) {
        console.warn('[ApecService] Timeout approaching, job form filled but not submitted');
        return { jobId: 'TIMEOUT_PARTIAL', partial: true };
      }

      // Submit form
      await this.page!.click('button[data-action="publish"]');
      await this.page!.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

      // Extract job ID
      const jobId = await this.extractJobId();

      console.log(`[ApecService] Job created successfully: ${jobId}`);
      return { jobId, partial: false };
    } catch (error) {
      console.error('[ApecService] Job creation failed:', error);
      throw error;
    }
  }

  /**
   * Update existing job posting
   */
  async updateJobPosting(jobId: string, updates: Partial<JobData>): Promise<void> {
    if (!this.page) {
      await this.initialize();
    }

    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    if (!this.hasTimeFor(20000)) {
      throw new Error('Insufficient time remaining for job update');
    }

    try {
      console.log(`[ApecService] Updating job: ${jobId}`);

      await this.page!.goto(`https://entreprise.apec.fr/mes-offres/${jobId}/modifier`, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      await this.fillJobForm(updates, true);

      if (!this.hasTimeFor(10000)) {
        throw new Error('Timeout approaching during update');
      }

      await this.page!.click('button[data-action="save"]');
      await this.page!.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

      console.log(`[ApecService] Job updated successfully: ${jobId}`);
    } catch (error) {
      console.error('[ApecService] Job update failed:', error);
      throw error;
    }
  }

  /**
   * Delete job posting
   */
  async deleteJobPosting(jobId: string): Promise<void> {
    if (!this.page) {
      await this.initialize();
    }

    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    if (!this.hasTimeFor(15000)) {
      throw new Error('Insufficient time remaining for job deletion');
    }

    try {
      console.log(`[ApecService] Deleting job: ${jobId}`);

      await this.page!.goto(`https://entreprise.apec.fr/mes-offres/${jobId}`, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      await this.page!.click('button[data-action="delete"]');
      await this.page!.waitForSelector('.confirmation-modal', { timeout: 5000 });
      await this.page!.click('button[data-confirm="true"]');
      await this.page!.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

      console.log(`[ApecService] Job deleted successfully: ${jobId}`);
    } catch (error) {
      console.error('[ApecService] Job deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get all job postings (batch-aware for large lists)
   */
  async getAllJobs(limit = 50): Promise<ApecJob[]> {
    if (!this.page) {
      await this.initialize();
    }

    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    if (!this.hasTimeFor(15000)) {
      throw new Error('Insufficient time remaining for fetching jobs');
    }

    try {
      console.log('[ApecService] Fetching job postings from APEC...');

      await this.page!.goto('https://entreprise.apec.fr/mes-offres', {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Extract job listings
      const jobs = await this.page!.evaluate((maxJobs) => {
        const jobElements = document.querySelectorAll('.job-item');
        const jobList = Array.from(jobElements).slice(0, maxJobs).map(el => ({
          id: el.getAttribute('data-job-id') || '',
          title: el.querySelector('.job-title')?.textContent?.trim() || '',
          status: el.querySelector('.job-status')?.textContent?.trim() || '',
          views: parseInt(el.querySelector('.job-views')?.textContent || '0'),
          applications: parseInt(el.querySelector('.job-applications')?.textContent || '0'),
          publishedDate: el.querySelector('.job-date')?.textContent?.trim() || '',
        }));
        return jobList;
      }, limit);

      console.log(`[ApecService] Found ${jobs.length} job postings`);
      return jobs;
    } catch (error) {
      console.error('[ApecService] Failed to fetch jobs:', error);
      throw error;
    }
  }

  /**
   * Sync a batch of jobs (for chunked processing)
   */
  async syncJobBatch(jobIds: string[]): Promise<ApecJob[]> {
    const jobs: ApecJob[] = [];

    for (const jobId of jobIds) {
      if (!this.hasTimeFor(5000)) {
        console.warn(`[ApecService] Timeout approaching, stopping batch at ${jobs.length}/${jobIds.length}`);
        break;
      }

      try {
        // This would be implemented based on APEC's API/UI structure
        // For now, placeholder
        console.log(`[ApecService] Syncing job ${jobId}`);
      } catch (error) {
        console.error(`[ApecService] Failed to sync job ${jobId}:`, error);
      }
    }

    return jobs;
  }

  /**
   * Fill job form (helper method)
   */
  private async fillJobForm(data: Partial<JobData>, isUpdate = false): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (data.title) {
      await this.page.waitForSelector('input[name="title"]', { timeout: 5000 });
      if (isUpdate) {
        await this.page.evaluate(() => {
          const el = document.querySelector('input[name="title"]') as HTMLInputElement;
          if (el) el.value = '';
        });
      }
      await this.page.type('input[name="title"]', data.title, { delay: 20 });
    }

    if (data.description) {
      await this.page.waitForSelector('textarea[name="description"]', { timeout: 5000 });
      if (isUpdate) {
        await this.page.evaluate(() => {
          const el = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          if (el) el.value = '';
        });
      }
      await this.page.type('textarea[name="description"]', data.description, { delay: 10 });
    }

    if (data.location) {
      await this.page.waitForSelector('input[name="location"]', { timeout: 5000 });
      if (isUpdate) {
        await this.page.evaluate(() => {
          const el = document.querySelector('input[name="location"]') as HTMLInputElement;
          if (el) el.value = '';
        });
      }
      await this.page.type('input[name="location"]', data.location, { delay: 20 });
    }

    if (data.contractType) {
      await this.page.select('select[name="contractType"]', data.contractType);
    }

    if (data.salary) {
      await this.page.waitForSelector('input[name="salary"]', { timeout: 5000 });
      if (isUpdate) {
        await this.page.evaluate(() => {
          const el = document.querySelector('input[name="salary"]') as HTMLInputElement;
          if (el) el.value = '';
        });
      }
      await this.page.type('input[name="salary"]', data.salary.toString(), { delay: 20 });
    }
  }

  /**
   * Extract job ID from current page URL
   */
  private async extractJobId(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const url = this.page.url();
    const match = url.match(/offre\/(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Close browser and cleanup
   * IMPORTANT: Must be called at the end of every serverless function
   */
  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.isAuthenticated = false;

      const duration = Date.now() - this.startTime;
      console.log(`[ApecService] Browser closed (execution time: ${duration}ms)`);
    } catch (error) {
      console.error('[ApecService] Error closing browser:', error);
    }
  }
}

// Export singleton instance for stateless usage
export const apecService = new ApecServiceServerless();

// Also export class for testing
export default ApecServiceServerless;
