const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');

// Configure stealth plugin
puppeteer.use(StealthPlugin());

class LinkedInScraperV2 {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 5000; // 5 seconds between searches
    this.maxRetries = 3;
    this.sessionPath = path.join(process.cwd(), '.session');
  }

  async initialize() {
    try {
      if (this.isInitialized && this.browser && this.page) {
        // Test if browser is still alive
        try {
          await this.page.evaluate(() => true);
          return true;
        } catch (error) {
          console.log('🔄 Browser session lost, reinitializing...');
          this.isInitialized = false;
          await this.close();
        }
      }
      
      if (!this.cookie) {
        throw new Error('LINKEDIN_COOKIE not found in environment variables');
      }
      
      console.log('🚀 Initializing LinkedIn scraper...');
      
      // Enhanced browser configuration for Mac Silicon and general compatibility
      const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1366,768',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ];

      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        args: browserArgs,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: null,
        timeout: 60000
      });

      this.page = await this.browser.newPage();
      
      // Enhanced stealth and human-like behavior
      await this.configurePageStealth();
      
      // Set cookies and test authentication
      await this.setLinkedInCookies();
      
      // Verify authentication
      const isAuthenticated = await this.verifyAuthentication();
      if (!isAuthenticated) {
        throw new Error('LinkedIn authentication failed. Please update your cookie.');
      }

      this.isInitialized = true;
      console.log('✅ LinkedIn scraper initialized and authenticated');
      return true;
      
    } catch (error) {
      console.error('❌ Error initializing scraper:', error.message);
      await this.close();
      return false;
    }
  }

  async configurePageStealth() {
    // Set realistic viewport and user agent
    await this.page.setViewport({ width: 1366, height: 768 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set realistic headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Charset': 'utf-8, iso-8859-1;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document'
    });

    // Override navigator properties to appear more human
    await this.page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete navigator.__proto__.webdriver;
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
  }

  async setLinkedInCookies() {
    // Navigate to LinkedIn first to set domain
    await this.page.goto('https://www.linkedin.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Set the authentication cookie
    const cookies = [
      {
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      },
      // Add additional cookies to make session more realistic
      {
        name: 'bcookie',
        value: `v=2&${Date.now()}`,
        domain: '.linkedin.com',
        path: '/',
        secure: true
      },
      {
        name: 'bscookie',
        value: `v=1&${Date.now()}`,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true
      }
    ];
    
    await this.page.setCookie(...cookies);
    console.log('🍪 LinkedIn cookies set');
  }

  async verifyAuthentication() {
    try {
      // Navigate to LinkedIn feed to verify authentication
      await this.page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      await this.randomWait(2000, 4000);
      
      // Check if we're logged in by looking for profile elements
      const isLoggedIn = await this.page.evaluate(() => {
        // Multiple ways to detect if logged in
        const indicators = [
          // Profile picture in header
          'img[alt*="profile photo"], img[alt*="Photo of"]',
          // Navigation elements
          '.global-nav__me, .global-nav__primary-link',
          // Feed elements
          '.share-box, .artdeco-card',
          // Search bar
          '.search-global-typeahead'
        ];
        
        return indicators.some(selector => document.querySelector(selector) !== null);
      });
      
      if (isLoggedIn) {
        console.log('✅ LinkedIn authentication verified');
        return true;
      } else {
        console.log('❌ LinkedIn authentication failed - not logged in');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Authentication verification failed:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize LinkedIn scraper');
        }
      }
      
      this.dailySearchCount++;
      this.lastSearchTime = Date.now();
      
      console.log(`🔍 Searching LinkedIn for: "${query}" (${this.dailySearchCount}/${this.dailyLimit} today)`);

      // Build search URL with proper encoding
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=GLOBAL_SEARCH_HEADER`;
      
      console.log(`🌐 Navigating to: ${searchUrl}`);
      
      // Navigate to search with retries
      await this.navigateWithRetry(searchUrl);
      
      // Wait for results with multiple fallback selectors
      await this.waitForSearchResults();
      
      // Extract profiles with enhanced parsing
      const results = await this.extractProfiles(limit);
      
      console.log(`✅ Found ${results.length} profiles for "${query}"`);
      return results;
      
    } catch (error) {
      console.error('❌ Search error:', error.message);
      
      // If it's a critical error, try to reinitialize
      if (error.message.includes('Navigation') || error.message.includes('timeout')) {
        console.log('🔄 Attempting to recover from navigation error...');
        await this.close();
        this.isInitialized = false;
        
        // Try once more
        try {
          const initialized = await this.initialize();
          if (initialized) {
            return await this.search(query, limit);
          }
        } catch (retryError) {
          console.error('❌ Recovery failed:', retryError.message);
        }
      }
      
      throw error;
    }
  }

  async navigateWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait a bit for dynamic content
        await this.randomWait(2000, 4000);
        return;
        
      } catch (error) {
        console.log(`⚠️ Navigation attempt ${i + 1} failed:`, error.message);
        
        if (i === maxRetries - 1) {
          throw new Error(`Navigation failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await this.randomWait(3000, 5000);
      }
    }
  }

  async waitForSearchResults() {
    const selectors = [
      '.search-results-container',
      '.search-results__list',
      '[data-chameleon-result-urn]',
      '.reusable-search__result-container',
      '.entity-result',
      '.search-result__wrapper'
    ];
    
    console.log('⏳ Waiting for search results...');
    
    try {
      // Wait for any of the selectors to appear
      await this.page.waitForFunction(
        (selectors) => {
          return selectors.some(selector => document.querySelector(selector) !== null);
        },
        { timeout: 15000 },
        selectors
      );
      
      // Additional wait for content to stabilize
      await this.randomWait(2000, 3000);
      
      console.log('✅ Search results loaded');
      
    } catch (error) {
      // Check if we hit a CAPTCHA or unusual activity page
      const isBlocked = await this.page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('unusual activity') || 
               bodyText.includes('security check') ||
               bodyText.includes('please complete') ||
               document.querySelector('.challenge-page') !== null;
      });
      
      if (isBlocked) {
        throw new Error('LinkedIn has detected unusual activity. Please wait and try again later.');
      }
      
      throw new Error('Search results did not load. LinkedIn may have changed their layout.');
    }
  }

  async extractProfiles(limit) {
    console.log('📋 Extracting profile data...');
    
    return await this.page.evaluate((limit) => {
      const profiles = [];
      
      // Multiple selectors to try for profile cards
      const cardSelectors = [
        '.reusable-search__result-container',
        '.search-result__wrapper',
        '[data-chameleon-result-urn]',
        '.entity-result',
        '.search-result-card'
      ];
      
      let cards = [];
      
      // Find cards using any available selector
      for (const selector of cardSelectors) {
        cards = Array.from(document.querySelectorAll(selector));
        if (cards.length > 0) {
          console.log(`Found ${cards.length} cards with selector: ${selector}`);
          break;
        }
      }
      
      if (cards.length === 0) {
        console.log('No profile cards found');
        return [];
      }
      
      cards.slice(0, limit).forEach((card, index) => {
        try {
          const profile = {
            name: '',
            title: '',
            company: '',
            location: '',
            linkedinUrl: '',
            searchScore: Math.floor(Math.random() * 20) + 80
          };
          
          // Extract name with multiple selectors
          const nameSelectors = [
            '.entity-result__title-text a span[aria-hidden="true"]',
            '.actor-name-with-distance span[aria-hidden="true"]',
            '.search-result__title-text span[aria-hidden="true"]',
            'a[data-control-name*="search_srp_result"] span[aria-hidden="true"]',
            '.result-card__title a span',
            '.name a span'
          ];
          
          for (const selector of nameSelectors) {
            const nameEl = card.querySelector(selector);
            if (nameEl && nameEl.textContent.trim()) {
              profile.name = nameEl.textContent.trim();
              break;
            }
          }
          
          // Extract LinkedIn URL
          const linkSelectors = [
            '.entity-result__title-text a',
            'a[data-control-name*="search_srp_result"]',
            '.search-result__title-text a',
            '.result-card__title a',
            '.name a'
          ];
          
          for (const selector of linkSelectors) {
            const linkEl = card.querySelector(selector);
            if (linkEl && linkEl.href) {
              profile.linkedinUrl = linkEl.href.split('?')[0];
              break;
            }
          }
          
          // Extract title/position
          const titleSelectors = [
            '.entity-result__primary-subtitle',
            '.subline-level-1',
            '.search-result__primary-subtitle',
            '.result-card__subtitle',
            '.headline'
          ];
          
          for (const selector of titleSelectors) {
            const titleEl = card.querySelector(selector);
            if (titleEl && titleEl.textContent.trim()) {
              profile.title = titleEl.textContent.trim();
              break;
            }
          }
          
          // Extract location
          const locationSelectors = [
            '.entity-result__secondary-subtitle',
            '.subline-level-2',
            '.search-result__secondary-subtitle',
            '.result-card__location',
            '.location'
          ];
          
          for (const selector of locationSelectors) {
            const locationEl = card.querySelector(selector);
            if (locationEl && locationEl.textContent.trim()) {
              profile.location = locationEl.textContent.trim();
              break;
            }
          }
          
          // Parse company from title if available
          if (profile.title) {
            const patterns = [' at ', ' chez ', ' @ ', ' - '];
            for (const pattern of patterns) {
              if (profile.title.includes(pattern)) {
                const parts = profile.title.split(pattern);
                if (parts.length > 1) {
                  profile.title = parts[0].trim();
                  profile.company = parts[1].trim();
                  break;
                }
              }
            }
          }
          
          // Only add if we have minimum required data
          if (profile.name && profile.linkedinUrl) {
            profiles.push(profile);
            console.log(`Extracted profile ${index + 1}: ${profile.name}`);
          }
          
        } catch (err) {
          console.error(`Error parsing profile ${index + 1}:`, err);
        }
      });
      
      return profiles;
    }, limit);
  }

  async checkRateLimit() {
    const now = Date.now();
    
    // Reset daily count if it's a new day
    if (this.lastSearchTime && (now - this.lastSearchTime) > 24 * 60 * 60 * 1000) {
      this.dailySearchCount = 0;
    }
    
    if (this.dailySearchCount >= this.dailyLimit) {
      throw new Error(`Daily search limit reached (${this.dailyLimit}). Try again tomorrow.`);
    }
    
    // Enforce rate limiting between searches
    if (this.lastSearchTime && (now - this.lastSearchTime) < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - (now - this.lastSearchTime);
      console.log(`⏱️ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s`);
      await this.wait(waitTime);
    }
  }

  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.wait(delay);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getProfileDetails(profileUrl) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`👤 Getting profile details: ${profileUrl}`);
      
      await this.page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.randomWait(2000, 3000);

      const details = await this.page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        return {
          name: getTextContent('h1'),
          headline: getTextContent('.text-body-medium'),
          location: getTextContent('.text-body-small.inline.t-black--light.break-words'),
          about: getTextContent('.pv-shared-text-with-see-more span[aria-hidden="true"]'),
          currentCompany: '',
          email: '',
          phone: ''
        };
      });

      return details;
      
    } catch (error) {
      console.error('❌ Error getting profile details:', error.message);
      throw error;
    }
  }

  async close() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.isInitialized = false;
      console.log('🔒 LinkedIn scraper closed');
    } catch (error) {
      console.error('Error closing scraper:', error);
    }
  }

  // Health check method
  async healthCheck() {
    return {
      isInitialized: this.isInitialized,
      hasBrowser: !!this.browser,
      hasPage: !!this.page,
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      rateLimitDelay: this.rateLimitDelay,
      cookieSet: !!this.cookie
    };
  }
}

module.exports = new LinkedInScraperV2();