/**
 * LinkedIn Master Service
 * 
 * Intelligent service that attempts real LinkedIn scraping first,
 * then falls back to mock data if scraping fails.
 */

const linkedinScraperV2 = require('./linkedinScraperV2');
const linkedinScraper = require('./linkedinScraper'); // Our enhanced scraper
const linkedinScraperOptimized = require('./linkedinScraperOptimized'); // Optimized version
const linkedinApiScraper = require('./linkedinApiScraper'); // API-based scraper
const linkedinChromeDriver = require('./linkedinChromeDriver');
const linkedinFallback = require('./linkedinFallback');

class LinkedInMaster {
  constructor() {
    this.useRealScraper = true;
    this.preferredScraper = process.env.LINKEDIN_SCRAPER_TYPE || 'api'; // 'api', 'optimized', 'enhanced', 'puppeteer', or 'chromedriver'
    this.fallbackEnabled = process.env.ENABLE_LINKEDIN_FALLBACK !== 'false';
    this.lastScraperTest = null;
    this.scraperStatus = 'untested';
    this.failureCount = 0;
    this.maxFailures = 3;
    this.availableScrapers = {
      apollo: require('./linkedinApollo'), // Apollo.io API for verified LinkedIn profiles (10k free/month)
      selenium_dom: require('./linkedinSeleniumDom'), // Selenium with real DOM interactions (anti-detection)
      mac_automation: require('./linkedinMacAutomation'), // AppleScript & Automator native macOS automation
      hybrid_smart: require('./linkedinHybridSmart'), // Hybrid: 1 Google attempt + smart fallback (78/day)
      google_direct: require('./linkedinGoogleDirect'), // Direct HTTP Google requests with anti-detection
      selenium_google: require('./linkedinSeleniumGoogle'), // Selenium Google search with human behavior
      browser: require('./linkedinBrowserScraper'), // Direct LinkedIn browser scraping with cookie
      real: require('./linkedinRealScraper'), // Real profiles scraper (no fakes)
      alternative: require('./linkedinAlternativeSearch'), // Alternative search engines + curated profiles
      google_custom: require('./linkedinGoogleCustomSearch'), // Official Google Custom Search API
      google_stealth: require('./linkedinGoogleStealth'), // Stealth Google with intelligent fallback
      google: require('./linkedinGoogleScraper'), // Google Search bypass (innovative approach)
      ultimate: require('./linkedinUltimate'), // Ultimate analysis and recommendations
      playwright: require('./linkedinPlaywright'), // Modern Playwright scraper (fast & reliable)
      selenium_optimized: require('./linkedinSeleniumOptimized'), // Fast Selenium with anti-detection
      selenium_human: require('./linkedinSeleniumHuman'), // Advanced Selenium with human behavior simulation
      honest: require('./linkedinHonest'), // Honest explanation of LinkedIn limitations
      real: require('./linkedinRealApi'), // Real profiles via LinkedIn API (most authentic)
      puppeteer_real: require('./linkedinPuppeteerReal'), // Real profiles scraper with Puppeteer
      api: linkedinApiScraper, // API-based scraper (fastest)
      optimized: linkedinScraperOptimized, // Optimized scraper for stability
      enhanced: linkedinScraper, // Our enhanced scraper with human behavior
      puppeteer: linkedinScraperV2,
      chromedriver: linkedinChromeDriver
    };
  }

  async initialize() {
    console.log('🎯 Initializing LinkedIn Master Service...');
    
    if (this.useRealScraper) {
      try {
        const currentScraper = this.availableScrapers[this.preferredScraper];
        const initialized = await currentScraper.initialize();
        if (initialized) {
          this.scraperStatus = 'active';
          this.failureCount = 0;
          console.log(`✅ LinkedIn ${this.preferredScraper} scraper is active`);
          return true;
        } else {
          throw new Error('Scraper initialization failed');
        }
      } catch (error) {
        console.log(`⚠️ LinkedIn ${this.preferredScraper} scraper failed to initialize:`, error.message);
        this.scraperStatus = 'failed';
        this.failureCount++;
        
        if (this.failureCount >= this.maxFailures) {
          console.log('🔄 Switching to fallback mode after multiple failures');
          this.useRealScraper = false;
        }
      }
    }
    
    if (this.fallbackEnabled) {
      console.log('🎭 LinkedIn fallback service is active');
      return true;
    }
    
    console.log('❌ No LinkedIn service available');
    return false;
  }

  async search(query, limit = 10) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const trimmedQuery = query.trim();
    console.log(`🔍 LinkedIn Master searching for: "${trimmedQuery}"`);

    // Try real scraper first
    if (this.useRealScraper && this.scraperStatus !== 'failed') {
      try {
        const currentScraper = this.availableScrapers[this.preferredScraper];
        console.log(`🚀 Attempting LinkedIn search with ${this.preferredScraper}...`);
        const results = await currentScraper.search(trimmedQuery, limit);
        
        if (results && results.length > 0) {
          this.scraperStatus = 'active';
          this.failureCount = 0;
          console.log(`✅ Real scraper found ${results.length} results`);
          
          return results.map(result => ({
            ...result,
            source: `linkedin_${this.preferredScraper}`,
            timestamp: new Date().toISOString()
          }));
        } else {
          throw new Error('No results from real scraper');
        }
        
      } catch (error) {
        console.log(`⚠️ ${this.preferredScraper} scraper failed:`, error.message);
        
        // Try alternative scrapers before giving up
        const alternatives = Object.keys(this.availableScrapers).filter(key => key !== this.preferredScraper);
        for (const altScraper of alternatives.slice(0, 1)) { // Try one alternative
          try {
            console.log(`🔄 Trying ${altScraper} as alternative...`);
            const altResults = await this.availableScrapers[altScraper].search(trimmedQuery, limit);
            if (altResults && altResults.length > 0) {
              console.log(`✅ ${altScraper} alternative succeeded`);
              return altResults.map(result => ({
                ...result,
                source: `linkedin_${altScraper}`,
                timestamp: new Date().toISOString()
              }));
            }
          } catch (altError) {
            console.log(`⚠️ ${altScraper} alternative also failed:`, altError.message);
          }
        }
        
        this.scraperStatus = 'failed';
        this.failureCount++;
        
        // If we've failed too many times, switch to fallback
        if (this.failureCount >= this.maxFailures) {
          console.log('🔄 Switching to fallback mode due to repeated failures');
          this.useRealScraper = false;
        }
      }
    }

    // Use fallback if real scraper failed or is disabled
    if (this.fallbackEnabled) {
      try {
        console.log('🎭 Using LinkedIn fallback...');
        const results = await linkedinFallback.search(trimmedQuery, limit);
        
        return results.map(result => ({
          ...result,
          source: 'linkedin_fallback',
          timestamp: new Date().toISOString(),
          note: 'Generated mock data for testing purposes'
        }));
        
      } catch (error) {
        console.error('❌ Fallback also failed:', error.message);
        throw new Error('Both LinkedIn scraper and fallback failed');
      }
    }

    throw new Error('No LinkedIn service available');
  }

  async getProfileDetails(profileUrl) {
    console.log(`👤 Getting profile details for: ${profileUrl}`);

    // Try real scraper first
    if (this.useRealScraper && this.scraperStatus === 'active') {
      try {
        const currentScraper = this.availableScrapers[this.preferredScraper];
        const details = await currentScraper.getProfileDetails(profileUrl);
        return {
          ...details,
          source: `linkedin_${this.preferredScraper}`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.log('⚠️ Real profile scraping failed:', error.message);
      }
    }

    // Use fallback
    if (this.fallbackEnabled) {
      const details = await linkedinFallback.getProfileDetails(profileUrl);
      return {
        ...details,
        source: 'linkedin_fallback',
        timestamp: new Date().toISOString()
      };
    }

    throw new Error('Profile details not available');
  }

  async testScraper() {
    console.log('🧪 Testing LinkedIn scraper capabilities...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      enhancedScraper: { available: false, error: null },
      puppeteerScraper: { available: false, error: null },
      chromedriverScraper: { available: false, error: null },
      fallback: { available: false, error: null },
      recommendation: 'unknown'
    };

    // Test Enhanced scraper
    try {
      await linkedinScraper.initialize();
      const testSearch = await linkedinScraper.search('test', 1);
      
      testResults.enhancedScraper.available = true;
      testResults.enhancedScraper.resultCount = testSearch.length;
      
    } catch (error) {
      testResults.enhancedScraper.error = error.message;
    }

    // Test Puppeteer scraper
    try {
      await linkedinScraperV2.initialize();
      const testSearch = await linkedinScraperV2.search('test', 1);
      
      testResults.puppeteerScraper.available = true;
      testResults.puppeteerScraper.resultCount = testSearch.length;
      
    } catch (error) {
      testResults.puppeteerScraper.error = error.message;
    }
    
    // Test ChromeDriver scraper
    try {
      await linkedinChromeDriver.initialize();
      const testSearch = await linkedinChromeDriver.search('test', 1);
      
      testResults.chromedriverScraper.available = true;
      testResults.chromedriverScraper.resultCount = testSearch.length;
      
    } catch (error) {
      testResults.chromedriverScraper.error = error.message;
    }

    // Test fallback
    try {
      const fallbackSearch = await linkedinFallback.search('test', 1);
      testResults.fallback.available = true;
      testResults.fallback.resultCount = fallbackSearch.length;
    } catch (error) {
      testResults.fallback.error = error.message;
    }

    // Determine recommendation (prioritize Enhanced)
    if (testResults.enhancedScraper.available) {
      testResults.recommendation = 'use_enhanced';
      this.preferredScraper = 'enhanced';
      this.useRealScraper = true;
      this.scraperStatus = 'active';
    } else if (testResults.puppeteerScraper.available) {
      testResults.recommendation = 'use_puppeteer';
      this.preferredScraper = 'puppeteer';
      this.useRealScraper = true;
      this.scraperStatus = 'active';
    } else if (testResults.chromedriverScraper.available) {
      testResults.recommendation = 'use_chromedriver';
      this.preferredScraper = 'chromedriver';
      this.useRealScraper = true;
      this.scraperStatus = 'active';
    } else if (testResults.fallback.available) {
      testResults.recommendation = 'use_fallback';
      this.useRealScraper = false;
    } else {
      testResults.recommendation = 'no_service_available';
    }

    console.log('🔍 Test completed:', testResults.recommendation);
    return testResults;
  }

  async healthCheck() {
    const health = {
      status: 'unknown',
      useRealScraper: this.useRealScraper,
      scraperStatus: this.scraperStatus,
      failureCount: this.failureCount,
      fallbackEnabled: this.fallbackEnabled,
      lastTest: this.lastScraperTest,
      services: {}
    };

    // Check real scraper
    try {
      const currentScraper = this.availableScrapers[this.preferredScraper];
      health.services.realScraper = await currentScraper.healthCheck();
    } catch (error) {
      health.services.realScraper = { error: error.message };
    }

    // Check fallback
    try {
      health.services.fallback = await linkedinFallback.healthCheck();
    } catch (error) {
      health.services.fallback = { error: error.message };
    }

    // Determine overall status
    if (this.useRealScraper && this.scraperStatus === 'active') {
      health.status = 'real_scraper_active';
    } else if (this.fallbackEnabled) {
      health.status = 'fallback_active';
    } else {
      health.status = 'no_service';
    }

    return health;
  }

  async close() {
    console.log('🔒 Closing LinkedIn Master Service...');
    
    try {
      const currentScraper = this.availableScrapers[this.preferredScraper];
      await currentScraper.close();
    } catch (error) {
      console.log('⚠️ Error closing real scraper:', error.message);
    }
    
    console.log('✅ LinkedIn Master Service closed');
  }

  // Force switch between services
  async switchToFallback() {
    console.log('🔄 Manually switching to fallback mode');
    this.useRealScraper = false;
    this.scraperStatus = 'disabled';
    
    try {
      const currentScraper = this.availableScrapers[this.preferredScraper];
      await currentScraper.close();
    } catch (error) {
      console.log('⚠️ Error closing scraper during switch:', error.message);
    }
  }

  async switchToRealScraper() {
    console.log(`🔄 Manually switching to real scraper mode (${this.preferredScraper})`);
    this.useRealScraper = true;
    this.failureCount = 0;
    this.scraperStatus = 'testing'; // Reset status first
    
    try {
      const currentScraper = this.availableScrapers[this.preferredScraper];
      const initialized = await currentScraper.initialize();
      if (initialized) {
        this.scraperStatus = 'active';
        console.log(`✅ Successfully switched to ${this.preferredScraper} scraper`);
        return true;
      } else {
        this.scraperStatus = 'failed';
        console.log(`❌ Failed to switch to ${this.preferredScraper} scraper`);
        return false;
      }
    } catch (error) {
      this.scraperStatus = 'failed';
      console.log(`❌ Error switching to ${this.preferredScraper} scraper:`, error.message);
      return false;
    }
  }

  // Get service status for UI
  getServiceInfo() {
    return {
      currentService: this.useRealScraper ? this.preferredScraper : 'fallback',
      preferredScraper: this.preferredScraper,
      status: this.scraperStatus,
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
      fallbackEnabled: this.fallbackEnabled,
      availableScrapers: Object.keys(this.availableScrapers)
    };
  }
}

module.exports = new LinkedInMaster();