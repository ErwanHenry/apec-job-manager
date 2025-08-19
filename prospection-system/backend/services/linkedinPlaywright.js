/**
 * LinkedIn Playwright Scraper
 * Alternative moderne à Selenium avec meilleure performance
 */

const { chromium } = require('playwright');

class LinkedInPlaywright {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      if (!this.cookie) {
        throw new Error('LINKEDIN_COOKIE not found');
      }

      console.log('🎭 Initialisation Playwright...');

      // Lancer le navigateur avec options anti-détection
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      // Créer un contexte avec user agent réaliste
      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 }
      });

      this.page = await context.newPage();

      // Masquer les traces d'automation
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        window.chrome = {
          runtime: {},
        };
      });

      console.log('🍪 Ajout du cookie LinkedIn...');
      
      // Ajouter le cookie LinkedIn
      await context.addCookies([{
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        secure: true,
        httpOnly: true
      }]);

      // Test de connexion rapide
      console.log('🔐 Test de connexion...');
      await this.page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });

      // Vérifier qu'on est connecté
      const isLoggedIn = await this.page.evaluate(() => {
        return !document.body.innerHTML.includes('guest-homepage') && 
               !document.body.innerHTML.includes('session_key');
      });

      if (!isLoggedIn) {
        throw new Error('Cookie LinkedIn invalide');
      }

      this.isInitialized = true;
      console.log('✅ Playwright LinkedIn initialisé');
      return true;

    } catch (error) {
      console.error('❌ Erreur d\'initialisation Playwright:', error.message);
      if (this.browser) {
        await this.browser.close();
      }
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Playwright scraper');
        }
      }

      this.dailySearchCount++;
      console.log(`🔍 Recherche Playwright: "${query}"`);

      // Navigation directe vers la recherche
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
      await this.page.goto(searchUrl, { 
        waitUntil: 'networkidle', 
        timeout: 20000 
      });

      // Attendre les résultats
      try {
        await this.page.waitForSelector('.reusable-search__result-container, .entity-result, .search-result', { 
          timeout: 10000 
        });
      } catch (error) {
        console.log('⚠️ Timeout sur les résultats, tentative d\'extraction...');
      }

      // Scroll pour charger plus de résultats
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await this.page.waitForTimeout(2000);

      // Extraire les profils
      const profiles = await this.extractProfiles(limit);

      console.log(`✅ ${profiles.length} profils extraits via Playwright`);
      return profiles;

    } catch (error) {
      console.error('❌ Erreur de recherche Playwright:', error.message);
      return [];
    }
  }

  async extractProfiles(limit) {
    try {
      const profiles = await this.page.evaluate((maxProfiles) => {
        const results = [];
        
        // Sélecteurs pour les cartes de profil
        const containers = document.querySelectorAll('.reusable-search__result-container, .entity-result, .search-result');
        
        for (let i = 0; i < Math.min(containers.length, maxProfiles); i++) {
          const container = containers[i];
          
          try {
            // Extraire le nom
            const nameElement = container.querySelector('span[aria-hidden="true"]');
            const name = nameElement ? nameElement.textContent.trim() : null;
            
            // Extraire l'URL LinkedIn
            const linkElement = container.querySelector('a[href*="/in/"]');
            const linkedinUrl = linkElement ? linkElement.href : null;
            
            // Extraire l'ID LinkedIn
            let linkedinId = null;
            if (linkedinUrl) {
              const match = linkedinUrl.match(/\/in\/([^\/\?]+)/);
              if (match) linkedinId = match[1];
            }
            
            // Extraire le titre
            const titleElement = container.querySelector('.entity-result__primary-subtitle, .search-result__subtitle');
            const title = titleElement ? titleElement.textContent.trim() : '';
            
            // Extraire la localisation
            const locationElement = container.querySelector('.entity-result__secondary-subtitle, .search-result__metadata');
            const location = locationElement ? locationElement.textContent.trim() : '';
            
            // Valider et ajouter le profil
            if (name && linkedinId && name !== 'LinkedIn Member' && name.length > 2) {
              results.push({
                name: name,
                title: title,
                company: '', // À extraire du titre si possible
                location: location,
                linkedinUrl: linkedinUrl,
                searchScore: 96,
                extractedAt: new Date().toISOString(),
                method: 'playwright',
                linkedinId: linkedinId
              });
            }
          } catch (error) {
            console.log('Erreur extraction profil:', error.message);
          }
        }
        
        return results;
      }, limit);

      return profiles || [];

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction Playwright:', error.message);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
    }
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      cookieConfigured: !!this.cookie,
      method: 'playwright'
    };
  }
}

module.exports = new LinkedInPlaywright();