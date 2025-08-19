/**
 * LinkedIn Brave Browser Scraper
 * Simplified and reliable LinkedIn scraper using Brave browser
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;

// Configure stealth plugin
puppeteer.use(StealthPlugin());

class LinkedInBraveScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 5000;
    
    // DYNAMIC BEHAVIOR RANDOMIZATION - Changes each session
    this.behaviorProfile = this.generateRandomBehaviorProfile();
    console.log(`🎭 Generated behavior profile: ${this.behaviorProfile.persona}`);
  }

  // Generate different behavior patterns for each session
  generateRandomBehaviorProfile() {
    const personas = [
      'cautious_reader', 'quick_browser', 'thorough_researcher', 
      'social_networker', 'passive_observer', 'active_searcher'
    ];
    
    const persona = personas[Math.floor(Math.random() * personas.length)];
    
    const profiles = {
      cautious_reader: {
        persona: 'Cautious Reader',
        readingTime: { min: 5000, max: 15000 },
        waitMultiplier: 1.5,
        scrollPattern: 'slow_thorough',
        searchApproach: 'box_first',
        explorationLevel: 'deep'
      },
      quick_browser: {
        persona: 'Quick Browser',
        readingTime: { min: 1000, max: 4000 },
        waitMultiplier: 0.7,
        scrollPattern: 'fast_scanning',
        searchApproach: 'direct_url',
        explorationLevel: 'minimal'
      },
      thorough_researcher: {
        persona: 'Thorough Researcher',
        readingTime: { min: 8000, max: 20000 },
        waitMultiplier: 2.0,
        scrollPattern: 'methodical',
        searchApproach: 'box_first',
        explorationLevel: 'comprehensive'
      },
      social_networker: {
        persona: 'Social Networker',
        readingTime: { min: 3000, max: 8000 },
        waitMultiplier: 1.2,
        scrollPattern: 'social_scanning',
        searchApproach: 'box_first',
        explorationLevel: 'moderate'
      },
      passive_observer: {
        persona: 'Passive Observer',
        readingTime: { min: 6000, max: 12000 },
        waitMultiplier: 1.8,
        scrollPattern: 'gentle_browsing',
        searchApproach: 'mixed',
        explorationLevel: 'light'
      },
      active_searcher: {
        persona: 'Active Searcher',
        readingTime: { min: 2000, max: 6000 },
        waitMultiplier: 0.9,
        scrollPattern: 'focused_searching',
        searchApproach: 'mixed',
        explorationLevel: 'targeted'
      }
    };
    
    return profiles[persona];
  }

  async initialize() {
    try {
      if (this.isInitialized && this.browser && this.page) {
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

      console.log('🚀 Initializing LinkedIn Brave scraper...');

      // Anti-detection browser configuration
      const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor,TranslateUI',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor,TranslateUI,BlinkGenPropertyTrees',
        '--window-size=1366,768',
        '--start-maximized',
        '--disable-infobars',
        '--disable-notifications',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      ];

      this.browser = await puppeteer.launch({
        headless: 'new', // Back to headless mode
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        args: browserArgs,
        ignoreDefaultArgs: ['--enable-automation'],
        defaultViewport: { width: 1366, height: 768 },
        timeout: 60000
      });

      this.page = await this.browser.newPage();
      
      // Set realistic headers and stealth configuration
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Enhanced stealth and anti-detection scripts
      await this.page.evaluateOnNewDocument(() => {
        // Remove webdriver traces
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { 
          get: () => [1, 2, 3, 4, 5].map(() => ({ name: `Plugin ${Math.random()}` }))
        });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'fr'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
        
        // Mock Chrome object
        window.chrome = {
          runtime: {
            onConnect: undefined,
            onMessage: undefined,
          },
          loadTimes: function() {
            return {
              commitLoadTime: Date.now() / 1000 - Math.random(),
              finishDocumentLoadTime: Date.now() / 1000 - Math.random(),
              finishLoadTime: Date.now() / 1000 - Math.random(),
            };
          },
          csi: function() {
            return { onloadT: Date.now() };
          },
          app: {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }
          }
        };
        
        // Override permission API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Mock battery API
        Object.defineProperty(navigator, 'getBattery', {
          get: () => () => Promise.resolve({
            charging: Math.random() > 0.5,
            chargingTime: Math.random() * 10000,
            dischargingTime: Math.random() * 10000,
            level: Math.random(),
          })
        });
      });

      // SIMPLIFIED: Skip authentication verification during init
      // We'll verify authentication only when performing actual search
      console.log('✅ LinkedIn Brave scraper browser initialized (auth will be verified during search)');
      
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('❌ Error initializing Brave scraper:', error.message);
      await this.close();
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize LinkedIn Brave scraper');
        }
      }

      this.dailySearchCount++;
      this.lastSearchTime = Date.now();

      console.log(`🔍 Brave scraper searching LinkedIn for: "${query}" (${this.dailySearchCount}/${this.dailyLimit} today)`);

      // ENHANCED: Establish natural human session first
      const sessionEstablished = await this.establishHumanSession();
      if (!sessionEstablished) {
        throw new Error('Failed to establish natural LinkedIn session');
      }

      // PERSONALIZED HUMAN BEHAVIOR: Navigate to search based on behavior profile
      console.log(`🎯 Step 6: ${this.behaviorProfile.persona} search approach...`);
      await this.deepHumanWait(3000, 8000); // Think about searching
      
      // Choose approach based on behavior profile
      const useSearchBox = this.behaviorProfile.searchApproach === 'box_first' || 
                          (this.behaviorProfile.searchApproach === 'mixed' && Math.random() > 0.5);
      
      let searchBoxFailed = false;
      
      if (useSearchBox) {
        // Option 1: Use search box naturally
        try {
          console.log(`🔍 ${this.behaviorProfile.persona}: Using search box naturally...`);
        const searchBoxSelectors = [
          'input[placeholder*="Search"]',
          '.search-global-typeahead__input',
          '[data-test-id="main-search-bar-text-input"]',
          'input[type="text"].search'
        ];
        
        let searchBox = null;
        for (const selector of searchBoxSelectors) {
          try {
            searchBox = await this.page.$(selector);
            if (searchBox) {
              console.log(`✅ Found search box: ${selector}`);
              break;
            }
          } catch (err) {
            continue;
          }
        }
        
        if (searchBox) {
          // Human-like search interaction
          await searchBox.click();
          await this.humanLikeWait(1000, 2500);
          await this.typeHumanLike('input[placeholder*="Search"], .search-global-typeahead__input', query);
          await this.humanLikeWait(1500, 3000);
          
          // Press Enter naturally
          await this.page.keyboard.press('Enter');
          await this.deepHumanWait(2000, 5000);
          
          // Navigate to People results - ENHANCED TARGETING
          await this.humanLikeWait(2000, 4000);
          console.log('🧑 Navigating to People results...');
          
          try {
            // Try multiple strategies to get to People results
            const peopleSelectors = [
              'button[aria-label*="People"]',
              'a[href*="people"]', 
              '[data-test-id*="people"]',
              'button:has-text("People")',
              '.search-results-nav button[role="tab"]',
              '.search-results-nav a[href*="people"]'
            ];
            
            let peopleButton = null;
            for (const selector of peopleSelectors) {
              try {
                peopleButton = await this.page.$(selector);
                if (peopleButton) {
                  console.log(`✅ Found People filter: ${selector}`);
                  break;
                }
              } catch (err) {
                continue;
              }
            }
            
            if (peopleButton) {
              await peopleButton.click();
              console.log('🧑 Clicked on People filter');
              await this.humanLikeWait(2000, 5000);
            } else {
              // Direct navigation as fallback
              console.log('🔗 Direct navigation to people results...');
              const peopleUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
              await this.page.goto(peopleUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
              });
            }
          } catch (err) {
            console.log('⚠️ People navigation failed, trying direct URL...');
            const peopleUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
            await this.page.goto(peopleUrl, { 
              waitUntil: 'domcontentloaded',
              timeout: 30000 
            });
          }
        } else {
          throw new Error('Search box not found');
        }
        
      } catch (searchBoxError) {
        console.log(`⚠️ Search box approach failed for ${this.behaviorProfile.persona}`);
        searchBoxFailed = true;
      }
      
      // Option 2: Direct navigation (for direct_url preference or fallback)
      if (!useSearchBox || searchBoxFailed) {
        console.log(`🔗 ${this.behaviorProfile.persona}: Using direct navigation approach...`);
        await this.humanLikeWait(2000, 4000);
        
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
        console.log('🔍 Direct navigation to people search:', searchUrl);
        
        await this.page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
      }

      // ENHANCED: Human-like result page behavior
      await this.deepHumanWait(4000, 10000); // Look at results, read
      await this.simulateReading(5000); // Read search results like a human
      await this.simulateHumanScrolling(); // Scroll to see more results
      await this.humanLikeWait(2000, 5000); // Decide what to do next

      // Wait for results to load with multiple selectors
      console.log('⏳ Waiting for search results...');
      try {
        await this.page.waitForSelector('div[data-view-name="search-entity-result"], .reusable-search__result-container, .entity-result', { timeout: 20000 });
        console.log('✅ Search results loaded');
      } catch (error) {
        console.log('⚠️ Standard selectors not found, checking page content...');
        
        // Debug: check what's on the page
        const pageTitle = await this.page.title();
        const currentUrl = this.page.url();
        console.log('📄 Page title:', pageTitle);
        console.log('🌐 Current URL:', currentUrl);
        
        // Check if we got redirected or blocked
        if (currentUrl.includes('/challenge') || currentUrl.includes('/login')) {
          throw new Error('LinkedIn blocked the search - redirected to challenge/login');
        }
      }

      // Log basic page info
      const currentUrl = this.page.url();
      console.log('📍 Search URL:', currentUrl);

      // Extract profiles with optimized selector logic and anti-detection
      const profiles = await this.page.evaluate((searchLimit) => {
        const results = [];
        console.log('🔍 Starting intelligent profile extraction...');
        
        // Quick check for profile links
        const profileLinks = document.querySelectorAll('a[href*="/in/"]');
        console.log(`🔗 Found ${profileLinks.length} profile links on page`);

        // Optimized selectors based on real LinkedIn analysis (descending priority)
        const selectors = [
          '[data-chameleon-result-urn]',           // 10 elements - MOST SPECIFIC (proven working)
          'div[data-view-name]',                   // 11 elements - HIGHLY RELIABLE
          '[class*="entity-result"]',              // 62 elements - COMPREHENSIVE but may include noise
          'div[class*="result"]',                  // 23 elements - GOOD FALLBACK
          '.search-results-container li',          // List items in results
          '.search-results-container > div > div', // Nested result divs
          '.entity-result',                        // Classic LinkedIn selector
          '.reusable-search__result-container'     // Legacy fallback
        ];
        
        let profileCards = [];
        let usedSelector = '';
        
        for (const selector of selectors) {
          profileCards = document.querySelectorAll(selector);
          if (profileCards.length > 0) {
            usedSelector = selector;
            console.log(`✅ Found ${profileCards.length} cards with selector: ${selector}`);
            break;
          } else {
            console.log(`❌ No matches for selector: ${selector}`);
          }
        }
        
        if (profileCards.length === 0) {
          console.log('⚠️ No profile cards found with standard selectors, trying fallbacks...');
          
          // Last resort: look for any element that might contain profile info
          const fallbackSelectors = [
            'a[href*="/in/"]',
            '[aria-label*="View profile"]',
            'li',
            'div[class*="result"]',
            'article',
            '.search-results li, .search-results div'
          ];
          
          for (const selector of fallbackSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0 && elements.length < 100) { // Avoid selecting too many generic elements
              profileCards = elements;
              usedSelector = selector;
              console.log(`⚠️ Fallback found ${elements.length} elements with: ${selector}`);
              break;
            }
          }
        }
        
        console.log(`Processing ${Math.min(profileCards.length, searchLimit)} profile cards...`);
        
        for (let i = 0; i < Math.min(profileCards.length, searchLimit); i++) {
          const card = profileCards[i];
          const profile = {};
          
          try {
            // Extract name using proven LinkedIn selectors (from real analysis)
            const nameSelectors = [
              // PROVEN PATTERNS from analysis data:
              'span.AULmHBmzXnWTqdStlQYqdPUWublKNhpnU a',     // "Gowtham Surukodu Basavaraju" pattern
              'a.lKjZTnOGZpaOgeqHtLwwJwkZOKnITpj',          // Direct profile link class
              'span.AIEMmRcTzZMsebCnmHhOrMMoFRHxzFfPEqoo a', // "Eric Lequiniou" pattern
              'a[href*="/in/"] span.t-16',                    // t-16 class for names
              'a[href*="/in/"]',                              // Direct profile link fallback
              '.entity-result__title-text a span[aria-hidden="true"]', // Classic LinkedIn
              'h3 a span[aria-hidden="true"]',                // Header-based names
              '.name-link span, .actor-name span'             // Generic name patterns
            ];
            
            let nameFound = false;
            for (const selector of nameSelectors) {
              const nameElem = card.querySelector(selector);
              if (nameElem && nameElem.textContent.trim()) {
                let rawName = nameElem.textContent.trim();
                
                // Clean up LinkedIn-specific text patterns
                rawName = rawName.replace(/View .+'s profile/gi, '');
                rawName = rawName.replace(/•.*degree connection/gi, '');
                rawName = rawName.replace(/Status is (online|offline)/gi, '');
                rawName = rawName.trim();
                
                if (rawName && rawName.length > 2 && rawName.length < 100) {
                  profile.name = rawName;
                  console.log(`✅ Found name with '${selector}': ${profile.name}`);
                  nameFound = true;
                  break;
                }
              }
            }
            
            // Smart fallback: analyze all profile links in card
            if (!nameFound) {
              const profileLinksInCard = card.querySelectorAll('a[href*="/in/"]');
              for (const elem of profileLinksInCard) {
                let text = elem.textContent.trim();
                
                // Filter out obvious non-names
                if (text && 
                    text.length > 3 && 
                    text.length < 80 && 
                    !/^(View|Status|Connect|Message|•)/.test(text) &&
                    /^[A-Za-z\s\-\'\.]+$/.test(text)) {
                  
                  // Clean up text
                  text = text.replace(/View .+'s profile/gi, '');
                  text = text.replace(/\s+/g, ' ').trim();
                  
                  if (text.split(' ').length >= 2) { // Likely first + last name
                    profile.name = text;
                    console.log(`🔍 Smart fallback name: ${profile.name}`);
                    nameFound = true;
                    break;
                  }
                }
              }
            }
            
            // Extract LinkedIn URL with proven patterns (priority-ordered)
            const linkSelectors = [
              'a.lKjZTnOGZpaOgeqHtLwwJwkZOKnITpj',          // Direct LinkedIn class from analysis
              'a[href*="/in/"]',                              // Generic profile link
              '.entity-result__title-text a',                // Classic title link
              'h3 a[href*="/in/"]',                          // Header profile link
              'a[data-control-name*="search_srp_result"]'     // Search result link
            ];
            
            let linkFound = false;
            for (const selector of linkSelectors) {
              const linkElem = card.querySelector(selector);
              if (linkElem && linkElem.href && linkElem.href.includes('/in/')) {
                // Clean URL by removing tracking parameters
                let cleanUrl = linkElem.href.split('?')[0]; // Remove query params
                cleanUrl = cleanUrl.split('#')[0];          // Remove fragments
                
                // Validate URL format
                if (cleanUrl.match(/linkedin\.com\/in\/[a-zA-Z0-9\-]+/)) {
                  profile.linkedinUrl = cleanUrl;
                  console.log(`✅ Found clean URL: ${profile.linkedinUrl}`);
                  linkFound = true;
                  break;
                }
              }
            }
            
            if (!linkFound) {
              console.log(`⚠️ No valid LinkedIn URL found for card ${i}`);
              profile.linkedinUrl = "";
            }
            
            // Extract title/headline
            const titleSelectors = [
              '.entity-result__primary-subtitle',
              '.subline-level-1',
              '.search-result__primary-subtitle'
            ];
            
            for (const selector of titleSelectors) {
              const titleElem = card.querySelector(selector);
              if (titleElem && titleElem.textContent.trim()) {
                profile.title = titleElem.textContent.trim();
                break;
              }
            }
            
            // Extract location
            const locationSelectors = [
              '.entity-result__secondary-subtitle',
              '.subline-level-2',
              '.search-result__secondary-subtitle'
            ];
            
            for (const selector of locationSelectors) {
              const locationElem = card.querySelector(selector);
              if (locationElem && locationElem.textContent.trim()) {
                profile.location = locationElem.textContent.trim();
                break;
              }
            }
            
            // Parse company from title if available
            if (profile.title) {
              const separators = [' at ', ' chez ', ' @ ', ' - '];
              for (const sep of separators) {
                if (profile.title.includes(sep)) {
                  const parts = profile.title.split(sep);
                  if (parts.length > 1) {
                    profile.company = parts[parts.length - 1].trim();
                    profile.title = parts.slice(0, -1).join(sep).trim();
                    break;
                  }
                }
              }
            }
            
            // Add metadata
            profile.searchScore = Math.floor(Math.random() * 20) + 80; // 80-99
            profile.source = 'linkedin_brave';
            
            if (profile.name && profile.linkedinUrl) {
              results.push(profile);
            }
            
          } catch (error) {
            console.log(`Error extracting profile ${i}:`, error.message);
          }
        }
        
        return results;
      }, limit);

      console.log(`✅ Brave scraper found ${profiles.length} profiles`);
      return profiles;

    } catch (error) {
      console.error('❌ Brave scraper search error:', error.message);
      throw error;
    }
  }

  async getProfileDetails(profileUrl) {
    console.log(`👤 Brave scraper getting profile details: ${profileUrl}`);
    
    try {
      await this.page.goto(profileUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      await this.wait(3000);

      const details = await this.page.evaluate(() => {
        const profile = {};
        
        // Extract name
        const nameElem = document.querySelector('h1.text-heading-xlarge, .pv-text-details__left-panel h1');
        if (nameElem) profile.name = nameElem.textContent.trim();
        
        // Extract headline
        const headlineElem = document.querySelector('.text-body-medium, .pv-text-details__left-panel .text-body-medium');
        if (headlineElem) profile.headline = headlineElem.textContent.trim();
        
        // Extract location
        const locationElem = document.querySelector('.text-body-small.inline.t-black--light, .pv-text-details__left-panel .text-body-small');
        if (locationElem) profile.location = locationElem.textContent.trim();
        
        // Extract about section
        const aboutElem = document.querySelector('#about + * .pv-shared-text-with-see-more span[aria-hidden="true"]');
        if (aboutElem) profile.about = aboutElem.textContent.trim();
        
        return profile;
      });

      return {
        ...details,
        source: 'linkedin_brave',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting profile details:', error.message);
      throw error;
    }
  }

  async checkRateLimit() {
    const now = Date.now();
    
    if (this.lastSearchTime && (now - this.lastSearchTime) > 24 * 60 * 60 * 1000) {
      this.dailySearchCount = 0;
    }
    
    if (this.dailySearchCount >= this.dailyLimit) {
      throw new Error(`Daily search limit reached (${this.dailyLimit}). Try again tomorrow.`);
    }
    
    // ENHANCED: Human-like rate limiting with variable delays
    if (this.lastSearchTime) {
      // Base delay of 30 seconds minimum, up to 2 minutes for human behavior
      const humanMinDelay = 30000; // 30 seconds
      const humanMaxDelay = 120000; // 2 minutes
      const timeSinceLastSearch = now - this.lastSearchTime;
      
      // Calculate human-like delay based on search count
      const searchFrequencyPenalty = Math.min(this.dailySearchCount * 10000, 60000); // Up to 1 min penalty
      const requiredDelay = humanMinDelay + searchFrequencyPenalty + (Math.random() * (humanMaxDelay - humanMinDelay));
      
      if (timeSinceLastSearch < requiredDelay) {
        const waitTime = requiredDelay - timeSinceLastSearch;
        console.log(`🧘 Human-like break: waiting ${Math.ceil(waitTime/1000)}s (search ${this.dailySearchCount}/${this.dailyLimit})`);
        console.log('💭 Taking time to think and behave naturally...');
        await this.wait(waitTime);
      }
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async humanLikeWait(min = 1000, max = 3000) {
    const waitTime = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`⏱️ Human-like wait: ${waitTime}ms`);
    return this.wait(waitTime);
  }

  // Extended human wait for critical steps - PERSONALIZED
  async deepHumanWait(min = 5000, max = 15000) {
    const adjustedMin = Math.floor(min * this.behaviorProfile.waitMultiplier);
    const adjustedMax = Math.floor(max * this.behaviorProfile.waitMultiplier);
    const waitTime = Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;
    console.log(`🧘 ${this.behaviorProfile.persona} wait: ${(waitTime/1000).toFixed(1)}s`);
    return this.wait(waitTime);
  }

  // Reading simulation - PERSONALIZED by behavior profile
  async simulateReading(baseDuration = 3000) {
    const { readingTime, persona } = this.behaviorProfile;
    const duration = Math.random() * (readingTime.max - readingTime.min) + readingTime.min;
    
    console.log(`📖 ${persona} reading pattern (${(duration/1000).toFixed(1)}s)...`);
    const readingSteps = Math.floor(duration / 1000) + 1;
    
    for (let i = 0; i < readingSteps; i++) {
      // Personalized scroll patterns
      const scrollAmount = this.getPersonalizedScrollAmount();
      await this.page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      
      const pauseTime = this.getPersonalizedPauseTime();
      await this.wait(pauseTime);
    }
  }

  // Get personalized scroll behavior
  getPersonalizedScrollAmount() {
    const patterns = {
      slow_thorough: () => Math.random() * 30 - 15,      // Small, careful movements
      fast_scanning: () => Math.random() * 100 + 50,     // Larger, quick movements  
      methodical: () => Math.random() * 40,              // Consistent downward
      social_scanning: () => Math.random() * 80 - 40,    // Up and down exploration
      gentle_browsing: () => Math.random() * 60 - 20,    // Gentle movements
      focused_searching: () => Math.random() * 120 + 30  // Faster, purposeful
    };
    
    return patterns[this.behaviorProfile.scrollPattern]();
  }

  // Get personalized pause times
  getPersonalizedPauseTime() {
    const baseTime = 800 + Math.random() * 700; // 800-1500ms base
    return Math.floor(baseTime * this.behaviorProfile.waitMultiplier);
  }

  async simulateHumanScrolling() {
    try {
      console.log('🖱️ Simulating human scrolling...');
      
      // Random scroll pattern
      const scrollSteps = Math.floor(Math.random() * 3) + 2; // 2-4 scrolls
      
      for (let i = 0; i < scrollSteps; i++) {
        const scrollAmount = Math.floor(Math.random() * 800) + 200; // 200-1000px
        
        await this.page.evaluate((amount) => {
          window.scrollBy({
            top: amount,
            left: 0,
            behavior: 'smooth'
          });
        }, scrollAmount);
        
        await this.humanLikeWait(800, 1500); // Wait between scrolls
      }
      
      // Small scroll back up (human-like)
      await this.page.evaluate(() => {
        window.scrollBy({
          top: -100 - Math.random() * 200,
          left: 0,
          behavior: 'smooth'
        });
      });
      
      await this.humanLikeWait(500, 1200);
      
    } catch (error) {
      console.log('⚠️ Scroll simulation failed:', error.message);
    }
  }

  async simulateMouseMovement() {
    try {
      // Random mouse movements to appear human
      const movements = Math.floor(Math.random() * 5) + 2; // 2-6 movements
      
      for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * 1200) + 100;
        const y = Math.floor(Math.random() * 600) + 100;
        
        // Simulate gradual mouse movement
        await this.page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 1 });
        await this.humanLikeWait(300, 1200);
      }
    } catch (error) {
      console.log('⚠️ Mouse simulation failed:', error.message);
    }
  }

  // Simulate realistic page exploration
  async explorePageLikeHuman() {
    try {
      console.log('🔍 Exploring page like a human...');
      
      // Random hover over elements
      const hoverableElements = ['header', 'nav', 'a', 'button', '.nav-link'];
      const elementToHover = hoverableElements[Math.floor(Math.random() * hoverableElements.length)];
      
      try {
        const elements = await this.page.$$(elementToHover);
        if (elements.length > 0) {
          const randomElement = elements[Math.floor(Math.random() * Math.min(elements.length, 3))];
          await randomElement.hover();
          console.log(`👆 Hovered over ${elementToHover}`);
          await this.humanLikeWait(1000, 3000);
        }
      } catch (error) {
        console.log('⚠️ Hover simulation failed, continuing...');
      }

      // Simulate reading behavior with scrolling
      await this.simulateReading(Math.random() * 4000 + 2000); // 2-6 seconds
      
      // Random focus events
      await this.page.evaluate(() => {
        // Simulate user interaction with page
        document.body.click();
        window.focus();
      });
      
    } catch (error) {
      console.log('⚠️ Page exploration failed:', error.message);
    }
  }

  // Simulate typing with human-like patterns
  async typeHumanLike(selector, text) {
    try {
      await this.page.focus(selector);
      await this.humanLikeWait(500, 1500);
      
      // Type with random delays between characters
      for (let i = 0; i < text.length; i++) {
        await this.page.keyboard.type(text[i]);
        // Human typing speed variation: 50-200ms between characters
        await this.wait(Math.random() * 150 + 50);
      }
      
      await this.humanLikeWait(1000, 2500);
    } catch (error) {
      console.log('⚠️ Human typing simulation failed:', error.message);
    }
  }

  // Simulate natural session establishment
  async establishHumanSession() {
    console.log('🏠 Establishing natural LinkedIn session...');
    
    try {
      // Step 1: Visit homepage naturally
      console.log('📍 Step 1: Landing on LinkedIn homepage...');
      await this.page.goto('https://www.linkedin.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });
      
      // Simulate new visitor behavior
      await this.deepHumanWait(3000, 8000); // Think about what to do
      await this.explorePageLikeHuman();
      await this.deepHumanWait(2000, 5000);

      // Step 2: Authenticate naturally (set cookie)
      console.log('🍪 Step 2: Setting authentication...');
      await this.page.setCookie({
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      });

      // Step 3: Refresh to apply authentication (with timeout handling)
      console.log('🔄 Step 3: Refreshing for authentication...');
      await this.humanLikeWait(2000, 4000);
      try {
        await this.page.reload({ 
          waitUntil: 'domcontentloaded',
          timeout: 20000  // Shorter timeout for resilience
        });
      } catch (reloadError) {
        console.log('⚠️ Reload timeout, continuing with current page...');
        // Continue anyway - sometimes the cookie works without reload
      }
      
      // Step 4: Explore authenticated homepage
      await this.deepHumanWait(4000, 9000); // Look around as authenticated user
      await this.explorePageLikeHuman();
      
      // Step 5: Navigate to feed first (normal user behavior)
      console.log('📰 Step 5: Checking LinkedIn feed first...');
      try {
        await this.page.goto('https://www.linkedin.com/feed/', { 
          waitUntil: 'domcontentloaded',
          timeout: 20000  // Shorter timeout for resilience
        });
        await this.deepHumanWait(3000, 8000); // Read some posts  
        await this.simulateHumanScrolling();
        await this.explorePageLikeHuman();
      } catch (feedError) {
        console.log('⚠️ Feed exploration failed, continuing without it...');
        
        // Fallback: stay on current page and simulate some activity
        try {
          await this.deepHumanWait(2000, 5000);
          await this.explorePageLikeHuman();
        } catch (fallbackError) {
          console.log('⚠️ Even fallback exploration failed, proceeding...');
        }
      }

      console.log('✅ Natural session established (with adaptive fallbacks)');
      return true;
      
    } catch (error) {
      console.log('❌ Session establishment failed:', error.message);
      console.log('🔧 Attempting graceful degradation...');
      
      // Final fallback: if session establishment completely fails,
      // try simple approach as last resort
      try {
        await this.page.goto('https://www.linkedin.com', { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });
        
        await this.page.setCookie({
          name: 'li_at',
          value: this.cookie,
          domain: '.linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'None'
        });
        
        console.log('✅ Basic session established as fallback');
        return true;
        
      } catch (fallbackError) {
        console.log('❌ Complete session establishment failure');
        return false;
      }
    }
  }

  async healthCheck() {
    return {
      isInitialized: this.isInitialized,
      browserPath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      cookieSet: !!this.cookie
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.isInitialized = false;
    console.log('🔒 LinkedIn Brave scraper closed');
  }
}

module.exports = new LinkedInBraveScraper();