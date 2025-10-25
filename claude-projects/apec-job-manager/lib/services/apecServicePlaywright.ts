/**
 * APEC Service - Playwright + Serverless
 *
 * Optimized for Vercel serverless environment using Playwright instead of Puppeteer
 * - playwright-core for browser automation
 * - playwright-aws-lambda for Chromium binaries
 * - Better error handling and modern API
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright-core'
import chromiumPackage from 'playwright-aws-lambda'
import { kv } from '@vercel/kv'
import crypto from 'crypto'

interface JobData {
  title: string
  description: string
  location: string
  contractType: string
  salary?: string
  experienceLevel?: string
  skills?: string[]
}

interface ApecJob {
  id: string
  title: string
  status: string
  views: number
  applications: number
  publishedDate: string
}

interface ApecCookies {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  }>
  createdAt: number
  expiresAt: number
}

class ApecServicePlaywright {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private isAuthenticated = false
  private readonly timeout = 55000 // 55s buffer
  private readonly encryptionKey: string
  private startTime: number = 0

  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey()

    if (!process.env.ENCRYPTION_KEY) {
      console.warn('WARNING: ENCRYPTION_KEY not set')
    }
  }

  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    )
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return `${iv.toString('hex')}:${encrypted}`
  }

  private decrypt(encrypted: string): string {
    const [ivHex, encryptedText] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey, 'hex'),
      iv
    )
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  private getRemainingTime(): number {
    return this.timeout - (Date.now() - this.startTime)
  }

  private hasTimeFor(estimatedMs: number): boolean {
    return this.getRemainingTime() > estimatedMs + 5000
  }

  async initialize(): Promise<void> {
    this.startTime = Date.now()

    try {
      console.log('[ApecService] Initializing Playwright browser...')

      const isLocal = process.env.NODE_ENV !== 'production'

      // Launch browser with Playwright
      this.browser = await chromium.launch({
        args: isLocal
          ? chromium.defaultArgs()
          : chromiumPackage.args,
        executablePath: isLocal
          ? process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
          : await chromiumPackage.executablePath,
        headless: true,
      })

      // Create context and page
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      })

      this.page = await this.context.newPage()
      this.page.setDefaultTimeout(30000)

      console.log('[ApecService] Browser initialized successfully')
    } catch (error) {
      console.error('[ApecService] Failed to initialize browser:', error)
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async authenticate(forceRefresh = false): Promise<void> {
    if (!this.page || !this.context) {
      throw new Error('Browser not initialized')
    }

    try {
      console.log('[ApecService] Starting authentication...')

      if (!forceRefresh) {
        const restored = await this.restoreCookies()
        if (restored) {
          await this.page.goto('https://entreprise.apec.fr/accueil', {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
          })

          const isLoggedIn = await this.page.locator('.user-menu').count() > 0

          if (isLoggedIn) {
            this.isAuthenticated = true
            console.log('[ApecService] Authenticated using cached cookies')
            return
          }

          console.log('[ApecService] Cached cookies expired, authenticating fresh...')
        }
      }

      await this.authenticateFresh()
      await this.saveCookies()

      console.log('[ApecService] Authentication completed successfully')
    } catch (error) {
      console.error('[ApecService] Authentication failed:', error)
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async authenticateFresh(): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized')
    }

    const email = process.env.APEC_EMAIL
    const password = process.env.APEC_PASSWORD

    if (!email || !password) {
      throw new Error('APEC_EMAIL and APEC_PASSWORD environment variables are required')
    }

    try {
      await this.page.goto('https://entreprise.apec.fr/accueil', {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      await this.page.locator('input[type="email"]').fill(email)
      await this.page.locator('input[type="password"]').fill(password)

      await Promise.all([
        this.page.locator('button[type="submit"]').click(),
        this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }),
      ])

      const isLoggedIn = await this.page.locator('.user-menu').count() > 0

      if (!isLoggedIn) {
        throw new Error('Login verification failed - user menu not found')
      }

      this.isAuthenticated = true
    } catch (error) {
      throw new Error(`Fresh authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async saveCookies(): Promise<void> {
    if (!this.context) {
      throw new Error('Browser context not initialized')
    }

    try {
      const cookies = await this.context.cookies()
      const now = Date.now()

      const cookieData: ApecCookies = {
        cookies: cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          expires: c.expires,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite as 'Strict' | 'Lax' | 'None' | undefined,
        })),
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
      }

      const encrypted = this.encrypt(JSON.stringify(cookieData))
      await kv.set('apec:cookies:default', encrypted, { ex: 86400 })

      console.log('[ApecService] Cookies saved to KV (24h TTL)')
    } catch (error) {
      console.error('[ApecService] Failed to save cookies:', error)
    }
  }

  private async restoreCookies(): Promise<boolean> {
    if (!this.context) {
      throw new Error('Browser context not initialized')
    }

    try {
      const encrypted = await kv.get<string>('apec:cookies:default')

      if (!encrypted) {
        console.log('[ApecService] No cached cookies found in KV')
        return false
      }

      const decrypted = this.decrypt(encrypted)
      const cookieData: ApecCookies = JSON.parse(decrypted)

      if (Date.now() > cookieData.expiresAt) {
        console.log('[ApecService] Cached cookies expired')
        await kv.del('apec:cookies:default')
        return false
      }

      await this.context.addCookies(cookieData.cookies)

      console.log('[ApecService] Cookies restored from KV')
      return true
    } catch (error) {
      console.error('[ApecService] Failed to restore cookies:', error)
      return false
    }
  }

  async getAllJobs(limit = 50): Promise<ApecJob[]> {
    if (!this.page) {
      await this.initialize()
    }

    if (!this.isAuthenticated) {
      await this.authenticate()
    }

    if (!this.hasTimeFor(15000)) {
      throw new Error('Insufficient time remaining for fetching jobs')
    }

    try {
      console.log('[ApecService] Fetching job postings from APEC...')

      await this.page!.goto('https://entreprise.apec.fr/mes-offres', {
        waitUntil: 'networkidle',
        timeout: 15000,
      })

      const jobs = await this.page!.evaluate((maxJobs) => {
        const jobElements = document.querySelectorAll('.job-item')
        return Array.from(jobElements).slice(0, maxJobs).map(el => ({
          id: el.getAttribute('data-job-id') || '',
          title: el.querySelector('.job-title')?.textContent?.trim() || '',
          status: el.querySelector('.job-status')?.textContent?.trim() || '',
          views: parseInt(el.querySelector('.job-views')?.textContent || '0'),
          applications: parseInt(el.querySelector('.job-applications')?.textContent || '0'),
          publishedDate: el.querySelector('.job-date')?.textContent?.trim() || '',
        }))
      }, limit)

      console.log(`[ApecService] Found ${jobs.length} job postings`)
      return jobs
    } catch (error) {
      console.error('[ApecService] Failed to fetch jobs:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close()
        this.page = null
      }

      if (this.context) {
        await this.context.close()
        this.context = null
      }

      if (this.browser) {
        await this.browser.close()
        this.browser = null
      }

      this.isAuthenticated = false

      const duration = Date.now() - this.startTime
      console.log(`[ApecService] Browser closed (execution time: ${duration}ms)`)
    } catch (error) {
      console.error('[ApecService] Error closing browser:', error)
    }
  }
}

export const apecService = new ApecServicePlaywright()
export default ApecServicePlaywright
