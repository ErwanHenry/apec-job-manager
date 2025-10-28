/**
 * APEC Service - @sparticuz/chromium + Puppeteer
 *
 * Optimized for Vercel serverless environment
 * - puppeteer-core for browser automation
 * - @sparticuz/chromium for Chromium binaries (modern fork of chrome-aws-lambda)
 * - Stable and proven solution for serverless
 */

import puppeteer, { Browser, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
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

interface PuppeteerCookie {
  name: string
  value: string
  domain?: string
  path?: string
  expires?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

interface ApecCookies {
  cookies: PuppeteerCookie[]
  createdAt: number
  expiresAt: number
}

class ApecServicePlaywright {
  private browser: Browser | null = null
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
      console.log('[ApecService] Initializing Puppeteer browser...')

      const isLocal = process.env.NODE_ENV !== 'production'

      // Launch browser with Puppeteer + @sparticuz/chromium
      const args = isLocal
        ? ['--no-sandbox', '--disable-setuid-sandbox']
        : [
            ...chromium.args,
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--dns-prefetch-disable',
          ]

      this.browser = await puppeteer.launch({
        args,
        executablePath: isLocal
          ? process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
          : await chromium.executablePath(),
        headless: 'shell', // Use headless shell for serverless
        defaultViewport: {
          width: 1280,
          height: 720,
        },
      })

      this.page = await this.browser.newPage()

      // Set user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Set default timeout
      this.page.setDefaultTimeout(30000)

      console.log('[ApecService] Browser initialized successfully')
    } catch (error) {
      console.error('[ApecService] Failed to initialize browser:', error)
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async authenticate(forceRefresh = false): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not initialized')
    }

    try {
      console.log('[ApecService] Starting authentication...')

      if (!forceRefresh) {
        const restored = await this.restoreCookies()
        if (restored) {
          await this.page.goto('https://www.apec.fr/recruteur.html', {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
          })

          // Check if user menu exists (logged in)
          const userMenu = await this.page.$('.user-menu')

          if (userMenu) {
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
      await this.page.goto('https://www.apec.fr/recruteur.html', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // Fill email and password (using actual APEC form selectors)
      await this.page.waitForSelector('input#emailid', { timeout: 10000 })
      await this.page.type('input#emailid', email)

      await this.page.waitForSelector('input#password', { timeout: 10000 })
      await this.page.type('input#password', password)

      // Submit form using JavaScript (bypasses clickability issues with modals)
      await this.page.evaluate(() => {
        const button = document.querySelector('button.popin-btn-primary') as HTMLButtonElement
        if (button && button.textContent?.includes('Se connecter')) {
          button.click()
        }
      })

      // Wait for login to complete (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify login by checking if we're logged in
      // Check multiple possible indicators of successful login
      const isLoggedIn = await this.page.evaluate(() => {
        // Check for user menu
        const userMenu = document.querySelector('.user-menu')
        if (userMenu) return true

        // Check if login form is gone
        const loginForm = document.querySelector('input#emailid')
        if (!loginForm) return true

        // Check for account/profile links
        const accountLink = document.querySelector('[href*="compte"]') ||
                           document.querySelector('[href*="profil"]') ||
                           document.querySelector('[href*="dashboard"]')
        return !!accountLink
      })

      if (!isLoggedIn) {
        throw new Error('Login verification failed - no logged-in indicators found')
      }

      this.isAuthenticated = true
    } catch (error) {
      throw new Error(`Fresh authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async saveCookies(): Promise<void> {
    if (!this.page) {
      throw new Error('Page not initialized')
    }

    try {
      const cookies = await this.page.cookies()
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
    if (!this.page) {
      throw new Error('Page not initialized')
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

      await this.page.setCookie(...cookieData.cookies)

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

      // Navigate to "Mes offres" page
      await this.page!.goto('https://www.apec.fr/recruteur/mon-espace/mes-offres.html', {
        waitUntil: 'networkidle0',
        timeout: 20000,
      })

      // Wait for page to load completely
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('[ApecService] Extracting jobs from page...')

      // Extract jobs from page using multiple strategies
      const jobs = await this.page!.evaluate(() => {
        const extractedJobs: any[] = []

        // Strategy 1: Look for table rows with job data
        const tableRows = document.querySelectorAll('tr[data-job-id], tr.job-row, tbody tr')
        tableRows.forEach((row) => {
          try {
            const cells = row.querySelectorAll('td')
            if (cells.length >= 4) {
              // Extract text from cells
              const titleElement = row.querySelector('a, .job-title, .title')
              const title = titleElement?.textContent?.trim() || ''

              // Try to find status
              const statusElement = row.querySelector('.status, .badge, [class*="status"]')
              const statusText = statusElement?.textContent?.trim().toLowerCase() || ''

              // Map French status to English
              let status = 'draft'
              if (statusText.includes('publi') || statusText.includes('en ligne')) {
                status = 'published'
              } else if (statusText.includes('pause')) {
                status = 'paused'
              } else if (statusText.includes('expir')) {
                status = 'expired'
              }

              // Extract views and applications (look for numbers)
              const viewsText = row.textContent || ''
              const viewsMatch = viewsText.match(/(\d+)\s*(vue|view)/i)
              const views = viewsMatch ? parseInt(viewsMatch[1]) : 0

              const appsMatch = viewsText.match(/(\d+)\s*(candidature|application)/i)
              const applications = appsMatch ? parseInt(appsMatch[1]) : 0

              // Extract ID from data attribute or generate from title
              const id = row.getAttribute('data-job-id') ||
                        row.getAttribute('data-id') ||
                        `apec-${title.substring(0, 20).replace(/\s+/g, '-')}-${Date.now()}`

              // Extract date
              const dateElement = row.querySelector('time, .date, [class*="date"]')
              const dateText = dateElement?.getAttribute('datetime') ||
                              dateElement?.textContent?.trim() ||
                              new Date().toISOString().split('T')[0]

              if (title && title.length > 3) {
                extractedJobs.push({
                  id,
                  title,
                  status,
                  views,
                  applications,
                  publishedDate: dateText,
                })
              }
            }
          } catch (err) {
            console.error('Error extracting job from row:', err)
          }
        })

        // Strategy 2: Look for card/article elements if no rows found
        if (extractedJobs.length === 0) {
          const cards = document.querySelectorAll('article, .job-card, [class*="offer"]')
          cards.forEach((card) => {
            try {
              const titleElement = card.querySelector('h2, h3, .title, a')
              const title = titleElement?.textContent?.trim() || ''

              const statusElement = card.querySelector('.status, .badge, [class*="status"]')
              const statusText = statusElement?.textContent?.trim().toLowerCase() || ''

              let status = 'draft'
              if (statusText.includes('publi') || statusText.includes('en ligne')) {
                status = 'published'
              }

              // Extract metrics from card
              const cardText = card.textContent || ''
              const viewsMatch = cardText.match(/(\d+)\s*(vue|view)/i)
              const views = viewsMatch ? parseInt(viewsMatch[1]) : 0

              const appsMatch = cardText.match(/(\d+)\s*(candidature|application)/i)
              const applications = appsMatch ? parseInt(appsMatch[1]) : 0

              const id = card.getAttribute('data-id') ||
                        `apec-${title.substring(0, 20).replace(/\s+/g, '-')}-${Date.now()}`

              if (title && title.length > 3) {
                extractedJobs.push({
                  id,
                  title,
                  status,
                  views,
                  applications,
                  publishedDate: new Date().toISOString().split('T')[0],
                })
              }
            } catch (err) {
              console.error('Error extracting job from card:', err)
            }
          })
        }

        // Strategy 3: Try to find JSON data in page
        if (extractedJobs.length === 0) {
          try {
            // Check window object for data
            const windowData = (window as any).__INITIAL_DATA__ ||
                              (window as any).__NEXT_DATA__ ||
                              (window as any).pageData

            if (windowData?.jobs) {
              return windowData.jobs.map((job: any) => ({
                id: job.id || `apec-${Date.now()}`,
                title: job.title || job.name || '',
                status: job.status === 'active' ? 'published' : 'draft',
                views: job.views || 0,
                applications: job.applications || job.candidatures || 0,
                publishedDate: job.publishedDate || new Date().toISOString().split('T')[0],
              }))
            }
          } catch (err) {
            console.error('Error extracting from window data:', err)
          }
        }

        return extractedJobs
      })

      console.log(`[ApecService] Successfully extracted ${jobs.length} real jobs from APEC`)

      if (jobs.length === 0) {
        console.warn('[ApecService] No jobs found - page structure may have changed')
        // Take a screenshot for debugging
        try {
          const screenshot = await this.page!.screenshot({ encoding: 'base64' })
          console.log('[ApecService] Screenshot saved for debugging (first 100 chars):', screenshot.substring(0, 100))
        } catch (err) {
          console.error('[ApecService] Could not take screenshot:', err)
        }
      }

      return jobs.slice(0, Math.min(limit, jobs.length))
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
