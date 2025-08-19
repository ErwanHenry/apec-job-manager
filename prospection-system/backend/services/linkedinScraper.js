const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class LinkedInScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 3000; // 3 seconds between searches
    
    // Human behavior randomization
    this.humanPatterns = {
      viewportSizes: [
        { width: 1366, height: 768 },
        { width: 1920, height: 1080 },
        { width: 1440, height: 900 },
        { width: 1536, height: 864 }
      ],
      userAgents: [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      scrollPatterns: [
        { direction: 'down', pixels: 300, speed: 'slow' },
        { direction: 'down', pixels: 500, speed: 'medium' },
        { direction: 'up', pixels: 200, speed: 'fast' },
        { direction: 'down', pixels: 800, speed: 'slow' }
      ],
      readingDelays: {
        min: 2000,
        max: 8000,
        profilePage: { min: 5000, max: 15000 }
      }
    };
    
    this.currentSession = {
      viewport: null,
      userAgent: null,
      sessionStartTime: Date.now(),
      searchCount: 0,
      lastActivityTime: Date.now()
    };
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }
      
      if (!this.cookie) {
        throw new Error('LINKEDIN_COOKIE not found in environment variables');
      }
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Enhanced stealth settings with randomization
      this.currentSession.viewport = this.getRandomElement(this.humanPatterns.viewportSizes);
      this.currentSession.userAgent = this.getRandomElement(this.humanPatterns.userAgents);
      
      await this.page.setViewport(this.currentSession.viewport);
      await this.page.setUserAgent(this.currentSession.userAgent);
      
      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8'
      });

      // Set LinkedIn cookie
      const cookies = [{
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      }];
      
      await this.page.setCookie(...cookies);
      
      // Test authentication by visiting LinkedIn
      await this.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
      await this.delay(2000, 3000);
      
      // Check if we're logged in
      const isLoggedIn = await this.page.evaluate(() => {
        return !document.querySelector('.guest-homepage') && 
               !document.querySelector('[data-test-id="guest-homepage"]');
      });
      
      if (!isLoggedIn) {
        throw new Error('LinkedIn authentication failed. Please update your cookie.');
      }

      this.isInitialized = true;
      console.log('✅ LinkedIn scraper initialized and authenticated');
      return true;
    } catch (error) {
      console.error('Error initializing scraper:', error.message);
      await this.close();
      return false;
    }
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
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
      await this.delay(waitTime, waitTime + 1000);
    }
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();
      await this.adaptBehaviorBasedOnTime();
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize LinkedIn scraper');
        }
      }
      
      this.dailySearchCount++;
      this.currentSession.searchCount++;
      this.lastSearchTime = Date.now();
      this.currentSession.lastActivityTime = Date.now();
      
      console.log(`🔍 Searching LinkedIn for: "${query}" (${this.dailySearchCount}/${this.dailyLimit} today, session: ${this.currentSession.searchCount})`);

      // Navigate to LinkedIn search - force people-only results
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER&searchId=${Date.now()}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Check if we need to switch to "People" filter
      await this.ensurePeopleFilter();

      // Wait for results to load with multiple possible selectors
      try {
        await this.page.waitForSelector('.search-results-container, .search-results__list, [data-chameleon-result-urn]', { timeout: 15000 });
      } catch (error) {
        // Check if we hit a rate limit or need to solve CAPTCHA
        const isBlocked = await this.page.evaluate(() => {
          return document.body.innerText.includes('unusual activity') || 
                 document.querySelector('.challenge-page') !== null;
        });
        
        if (isBlocked) {
          throw new Error('LinkedIn has detected unusual activity. Please wait and try again later.');
        }
        throw new Error('Search results did not load. LinkedIn may have changed their layout.');
      }
      
      // Add random delays and human-like interactions
      await this.simulateHumanBrowsing();
      await this.delay(2000, 4000);

      const results = [];
      let currentPage = 1;

      while (results.length < limit) {
        // Extract profiles from current page with improved selectors
        const pageResults = await this.page.evaluate(() => {
          const profiles = [];
          
          // Enhanced selectors for different LinkedIn layouts
          const cardSelectors = [
            // New LinkedIn layout (2024)
            '.reusable-search__result-container',
            '.entity-result__item',
            '.search-result',
            // Legacy layouts
            '.search-result__wrapper',
            '[data-chameleon-result-urn]',
            '.entity-result',
            // Alternative layouts
            '.search-entity-result',
            '.people-search-card'
          ];
          
          let cards = [];
          let usedSelector = '';
          for (const selector of cardSelectors) {
            cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
              usedSelector = selector;
              break;
            }
          }
          
          console.log(`Using selector: ${usedSelector}, found ${cards.length} cards`);
          
          cards.forEach((card, index) => {
            try {
              // Enhanced name selectors for different layouts
              const nameSelectors = [
                // Most specific to least specific
                '.entity-result__title-text a .visually-hidden',
                '.entity-result__title-text a span[aria-hidden="true"]',
                '.actor-name-with-distance span[aria-hidden="true"]',
                '.search-result__title-text span[aria-hidden="true"]',
                'a[data-control-name="search_srp_result"] span[aria-hidden="true"]',
                '.search-result__title a span',
                '.entity-result__title a',
                'h3 a span',
                '.name-link span',
                // Fallback selectors
                '.entity-result__title-text a',
                'a[href*="/in/"] span:first-child'
              ];
              
              // Enhanced link selectors
              const linkSelectors = [
                '.entity-result__title-text a[href*="/in/"]',
                'a[data-control-name="search_srp_result"][href*="/in/"]',
                '.search-result__title-text a[href*="/in/"]',
                'a[href*="/in/"]',
                '.entity-result__title a'
              ];
              
              // Enhanced title/subtitle selectors
              const titleSelectors = [
                '.entity-result__primary-subtitle',
                '.entity-result__subtitle',
                '.subline-level-1',
                '.search-result__primary-subtitle',
                '.search-result__subtitle',
                '.result-context .t-14',
                '.people-search-card__subtitle'
              ];
              
              const locationSelectors = [
                '.entity-result__secondary-subtitle',
                '.subline-level-2',
                '.search-result__secondary-subtitle',
                '.result-context .t-12',
                '.people-search-card__location'
              ];
              
              let nameElement = null;
              let linkElement = null;
              let titleElement = null;
              let locationElement = null;
              
              // Find elements using multiple selectors with logging
              for (const selector of nameSelectors) {
                nameElement = card.querySelector(selector);
                if (nameElement && nameElement.innerText?.trim()) break;
              }
              
              for (const selector of linkSelectors) {
                linkElement = card.querySelector(selector);
                if (linkElement && linkElement.href?.includes('/in/')) break;
              }
              
              for (const selector of titleSelectors) {
                titleElement = card.querySelector(selector);
                if (titleElement && titleElement.innerText?.trim()) break;
              }
              
              for (const selector of locationSelectors) {
                locationElement = card.querySelector(selector);
                if (locationElement && locationElement.innerText?.trim()) break;
              }
              
              if (nameElement && linkElement && nameElement.innerText?.trim()) {
                const name = nameElement.innerText.trim();
                const linkedinUrl = linkElement.href.split('?')[0];
                
                // Validate that this is actually a profile URL
                if (!linkedinUrl.includes('/in/') || name.length < 2) {
                  return; // Skip invalid entries
                }
                
                const profile = {
                  name: name,
                  title: titleElement ? titleElement.innerText.trim() : '',
                  location: locationElement ? locationElement.innerText.trim() : '',
                  linkedinUrl: linkedinUrl,
                  company: '',
                  searchScore: Math.floor(Math.random() * 20) + 80,
                  extractedAt: new Date().toISOString(),
                  cardIndex: index,
                  layout: usedSelector
                };

                // Enhanced company extraction from title
                if (profile.title) {
                  const patterns = [
                    ' at ', ' chez ', ' @ ', ' de ', ' en ', 
                    ' - ', ' | ', ' dans ', ' pour '
                  ];
                  
                  for (const pattern of patterns) {
                    if (profile.title.toLowerCase().includes(pattern)) {
                      const titleParts = profile.title.split(new RegExp(pattern, 'i'));
                      if (titleParts.length > 1) {
                        profile.title = titleParts[0].trim();
                        profile.company = titleParts[1].trim();
                        // Clean up common suffixes
                        profile.company = profile.company.replace(/\s*(\|.*|\-.*|\(.*\))$/, '').trim();
                        break;
                      }
                    }
                  }
                }

                profiles.push(profile);
              } else {
                console.log(`Card ${index}: Missing required elements`, {
                  hasName: !!nameElement,
                  hasLink: !!linkElement,
                  nameText: nameElement?.innerText?.substring(0, 20),
                  linkHref: linkElement?.href?.substring(0, 50)
                });
              }
            } catch (err) {
              console.error('Error parsing profile:', err);
            }
          });
          
          return profiles;
        });

        results.push(...pageResults);

        if (results.length >= limit) {
          break;
        }

        // Check if there's a next page
        const hasNextPage = await this.page.evaluate(() => {
          const nextButton = document.querySelector('button[aria-label="Next"]');
          return nextButton && !nextButton.disabled;
        });

        if (!hasNextPage || currentPage >= 3) { // Limit to 3 pages for safety
          break;
        }

        // Simulate human interaction before clicking next page
        await this.simulateHumanInteraction();
        await this.page.click('button[aria-label="Next"]');
        await this.delay(5000, 8000); // Longer delay between pages
        currentPage++;
      }

      console.log(`✅ Found ${results.length} profiles for "${query}"`);
      return results.slice(0, limit);
    } catch (error) {
      console.error('Error during search:', error.message);
      
      // If it's a rate limit error, don't retry
      if (error.message.includes('Daily search limit') || error.message.includes('unusual activity')) {
        throw error;
      }
      
      // For other errors, try to reinitialize once
      console.log('🔄 Attempting to reinitialize scraper...');
      await this.close();
      const reinitialized = await this.initialize();
      if (!reinitialized) {
        throw new Error('Failed to reinitialize LinkedIn scraper');
      }
      
      throw error;
    }
  }

  async getProfileDetails(profileUrl) {
    try {
      if (!this.page) {
        await this.initialize();
      }

      await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
      await this.delay(2000, 3000);

      const details = await this.page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.innerText.trim() : '';
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

      // Try to find contact info (usually requires premium)
      try {
        const contactInfoButton = await this.page.$('a[href*="overlay/contact-info/"]');
        if (contactInfoButton) {
          await contactInfoButton.click();
          await this.delay(1000, 2000);
          
          const contactInfo = await this.page.evaluate(() => {
            const email = document.querySelector('.ci-email a');
            const phone = document.querySelector('.ci-phone span');
            
            return {
              email: email ? email.innerText.trim() : '',
              phone: phone ? phone.innerText.trim() : ''
            };
          });
          
          details.email = contactInfo.email;
          details.phone = contactInfo.phone;
        }
      } catch (err) {
        // Contact info might not be available
      }

      return details;
    } catch (error) {
      console.error('Error getting profile details:', error);
      throw error;
    }
  }

  async sendMessage(profileUrl, message) {
    try {
      if (!this.page) {
        await this.initialize();
      }

      await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
      await this.delay(2000, 3000);

      // Click message button
      const messageButton = await this.page.$('button[aria-label*="Message"]');
      if (!messageButton) {
        throw new Error('Message button not found');
      }

      await messageButton.click();
      await this.delay(1000, 2000);

      // Type message with human-like behavior
      const messageBox = await this.page.waitForSelector('.msg-form__contenteditable', { timeout: 5000 });
      
      // Clear any existing text
      await messageBox.click({ clickCount: 3 });
      await this.delay(200, 500);
      
      // Type with variable delays to simulate human typing
      for (let i = 0; i < message.length; i++) {
        const char = message[i];
        await messageBox.type(char, { delay: Math.floor(Math.random() * 150) + 50 });
        
        // Occasional longer pauses (thinking/reading)
        if (Math.random() < 0.1) {
          await this.delay(300, 800);
        }
      }
      
      await this.delay(1000, 3000); // Review message before sending

      // Send message
      const sendButton = await this.page.$('button[type="submit"].msg-form__send-button');
      if (sendButton) {
        await sendButton.click();
        await this.delay(1000, 2000);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  delay(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  async simulateHumanBrowsing() {
    try {
      // Random scrolling to simulate reading
      const scrollCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < scrollCount; i++) {
        const pattern = this.getRandomElement(this.humanPatterns.scrollPatterns);
        await this.page.evaluate((pattern) => {
          const scrollAmount = pattern.direction === 'down' ? pattern.pixels : -pattern.pixels;
          window.scrollBy({
            top: scrollAmount,
            behavior: pattern.speed === 'fast' ? 'auto' : 'smooth'
          });
        }, pattern);
        await this.delay(800, 2000);
      }

      // Random mouse movements
      const viewport = await this.page.viewport();
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
        const x = Math.floor(Math.random() * viewport.width);
        const y = Math.floor(Math.random() * viewport.height);
        await this.page.mouse.move(x, y);
        await this.delay(200, 800);
      }
    } catch (error) {
      // Ignore errors in human simulation
    }
  }

  async simulateHumanInteraction() {
    try {
      // Simulate hovering over elements
      const elements = await this.page.$$('.entity-result__title-text, .search-result__info');
      if (elements.length > 0) {
        const randomElement = elements[Math.floor(Math.random() * Math.min(elements.length, 3))];
        await randomElement.hover();
        await this.delay(500, 1500);
      }

      // Random pause to simulate reading
      const readingTime = Math.floor(Math.random() * 
        (this.humanPatterns.readingDelays.max - this.humanPatterns.readingDelays.min)) + 
        this.humanPatterns.readingDelays.min;
      await this.delay(readingTime - 1000, readingTime + 1000);
    } catch (error) {
      // Ignore errors in human simulation
    }
  }

  async simulateTypingDelay(text) {
    // Simulate human typing with variable delays
    const delays = [];
    for (let i = 0; i < text.length; i++) {
      delays.push(Math.floor(Math.random() * 150) + 50);
    }
    return delays;
  }

  async adaptBehaviorBasedOnTime() {
    const currentHour = new Date().getHours();
    
    // Adjust behavior based on time of day
    if (currentHour < 9 || currentHour > 18) {
      // Off-hours: slower, more cautious
      this.rateLimitDelay = Math.max(this.rateLimitDelay, 5000);
    } else {
      // Business hours: normal pace
      this.rateLimitDelay = 3000;
    }
    
    // Add session duration awareness
    const sessionDuration = Date.now() - this.currentSession.sessionStartTime;
    if (sessionDuration > 30 * 60 * 1000) { // 30 minutes
      // Take longer breaks after extended sessions
      await this.delay(10000, 20000);
      console.log('🕐 Taking extended break to maintain human-like session patterns');
    }
  }

  async ensurePeopleFilter() {
    try {
      // Check if we're on the right page by looking for people-specific elements
      const isOnPeoplePage = await this.page.evaluate(() => {
        return window.location.href.includes('/search/results/people/') ||
               document.querySelector('[data-vertical="PEOPLE"]') !== null;
      });

      if (!isOnPeoplePage) {
        // Try to click on "People" filter if available
        const peopleFilter = await this.page.$('button[aria-label*="People"], a[href*="/search/results/people/"]');
        if (peopleFilter) {
          console.log('🔄 Switching to People filter...');
          await peopleFilter.click();
          await this.delay(2000, 4000);
        } else {
          // Navigate directly to people search
          const currentQuery = new URL(this.page.url()).searchParams.get('keywords');
          if (currentQuery) {
            const peopleUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(currentQuery)}`;
            await this.page.goto(peopleUrl, { waitUntil: 'networkidle2' });
            await this.delay(1000, 2000);
          }
        }
      }

      // Verify we have people results
      await this.delay(1000, 2000);
      const hasPeopleResults = await this.page.evaluate(() => {
        const selectors = [
          '.reusable-search__result-container',
          '.search-result__wrapper',
          '[data-chameleon-result-urn]',
          '.entity-result'
        ];
        
        for (const selector of selectors) {
          if (document.querySelectorAll(selector).length > 0) {
            return true;
          }
        }
        return false;
      });

      if (!hasPeopleResults) {
        console.log('⚠️ No people results found, may need to adjust search strategy');
      }

    } catch (error) {
      console.log('⚠️ Error ensuring people filter:', error.message);
    }
  }
}

module.exports = new LinkedInScraper();
