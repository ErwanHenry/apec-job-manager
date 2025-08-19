const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class LinkedInScraperOptimized {
  constructor() {
    this.browser = null;
    this.page = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 3000;
    
    // Paramètres optimisés pour éviter les timeouts
    this.timeouts = {
      navigation: 45000,   // 45 secondes pour la navigation
      selector: 20000,     // 20 secondes pour attendre les sélecteurs
      network: 15000       // 15 secondes pour le réseau
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
      
      console.log('🚀 Initialisation du scraper LinkedIn optimisé...');
      
      // Configuration optimisée pour éviter les timeouts
      this.browser = await puppeteer.launch({
        headless: 'new',  // Mode headless plus stable
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',  // Désactiver les images pour la vitesse
          '--disable-javascript-harmony-shipping',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection',
          '--window-size=1366,768'
        ],
        defaultViewport: { width: 1366, height: 768 },
        timeout: this.timeouts.navigation
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page pour optimiser la vitesse
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Désactiver les ressources lourdes
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Configuration des cookies
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
      
      // Test de connexion simplifié
      console.log('🔗 Test de connexion LinkedIn...');
      await this.page.goto('https://www.linkedin.com/feed/', { 
        waitUntil: 'domcontentloaded',  // Plus rapide que networkidle2
        timeout: this.timeouts.navigation 
      });
      
      // Attente simplifiée
      await this.delay(2000, 3000);
      
      // Vérification de connexion simple
      const isLoggedIn = await this.page.evaluate(() => {
        return !document.querySelector('.guest-homepage') && 
               !document.querySelector('[data-test-id=\"guest-homepage\"]') &&
               !document.querySelector('input[name=\"session_key\"]');
      });
      
      if (!isLoggedIn) {
        throw new Error('LinkedIn authentication failed. Please update your cookie.');
      }

      this.isInitialized = true;
      console.log('✅ Scraper LinkedIn optimisé initialisé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error.message);
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
          throw new Error('Failed to initialize LinkedIn scraper');
        }
      }
      
      this.dailySearchCount++;
      this.lastSearchTime = Date.now();
      
      console.log(`🔍 Recherche LinkedIn optimisée: "${query}" (${this.dailySearchCount}/${this.dailyLimit})`);

      // Navigation vers la recherche avec timeout optimisé
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
      await this.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: this.timeouts.navigation 
      });

      // Attente des résultats avec sélecteurs multiples
      console.log('⏳ Attente des résultats...');
      try {
        await this.page.waitForSelector('.search-results-container, .search-results__list, [data-chameleon-result-urn], .entity-result', { 
          timeout: this.timeouts.selector 
        });
        console.log('✅ Résultats chargés');
      } catch (error) {
        console.log('⚠️ Timeout des sélecteurs standard, vérification du contenu...');
        
        // Vérifier s'il y a du contenu même sans sélecteurs spécifiques
        const hasContent = await this.page.evaluate(() => {
          const links = document.querySelectorAll('a[href*=\"/in/\"]');
          return links.length > 0;
        });
        
        if (!hasContent) {
          throw new Error('Aucun résultat trouvé ou page bloquée');
        }
      }
      
      // Délai pour s'assurer que tout est chargé
      await this.delay(3000, 5000);

      // Extraction des profils avec méthode robuste
      const results = await this.page.evaluate((searchLimit) => {
        const profiles = [];
        console.log('🔍 Extraction des profils...');
        
        // Sélecteurs multiples pour la robustesse
        const cardSelectors = [
          '.reusable-search__result-container',
          '.entity-result__item',
          '.search-result',
          '[data-chameleon-result-urn]',
          '.entity-result'
        ];
        
        let cards = [];
        let usedSelector = '';
        
        for (const selector of cardSelectors) {
          cards = document.querySelectorAll(selector);
          if (cards.length > 0) {
            usedSelector = selector;
            console.log(`Trouvé ${cards.length} cartes avec ${selector}`);
            break;
          }
        }
        
        if (cards.length === 0) {
          // Méthode de fallback : chercher tous les liens de profil
          console.log('Fallback: recherche de liens de profil...');
          const profileLinks = document.querySelectorAll('a[href*=\"/in/\"]');
          
          for (let i = 0; i < Math.min(profileLinks.length, searchLimit); i++) {
            const link = profileLinks[i];
            const container = link.closest('li, div, article') || link.parentElement;
            
            if (container) {
              const nameElement = container.querySelector('span[aria-hidden=\"true\"]') || link;
              const name = nameElement ? nameElement.innerText.trim() : '';
              
              if (name && name.length > 2 && !name.includes('LinkedIn')) {
                profiles.push({
                  name: name,
                  title: '',
                  location: '',
                  linkedinUrl: link.href.split('?')[0],
                  company: '',
                  searchScore: Math.floor(Math.random() * 20) + 80,
                  extractedAt: new Date().toISOString(),
                  method: 'fallback'
                });
              }
            }
          }
          
          return profiles;
        }
        
        // Extraction normale avec les cartes trouvées
        for (let i = 0; i < Math.min(cards.length, searchLimit); i++) {
          const card = cards[i];
          
          try {
            // Sélecteurs de nom multiples
            const nameSelectors = [
              '.entity-result__title-text a span[aria-hidden=\"true\"]',
              '.actor-name-with-distance span[aria-hidden=\"true\"]',
              '.search-result__title-text span[aria-hidden=\"true\"]',
              'a[data-control-name=\"search_srp_result\"] span[aria-hidden=\"true\"]'
            ];
            
            // Sélecteurs de lien multiples
            const linkSelectors = [
              '.entity-result__title-text a[href*=\"/in/\"]',
              'a[data-control-name=\"search_srp_result\"][href*=\"/in/\"]',
              'a[href*=\"/in/\"]'
            ];
            
            let nameElement = null;
            let linkElement = null;
            
            for (const selector of nameSelectors) {
              nameElement = card.querySelector(selector);
              if (nameElement && nameElement.innerText?.trim()) break;
            }
            
            for (const selector of linkSelectors) {
              linkElement = card.querySelector(selector);
              if (linkElement && linkElement.href?.includes('/in/')) break;
            }
            
            if (nameElement && linkElement) {
              const name = nameElement.innerText.trim();
              const linkedinUrl = linkElement.href.split('?')[0];
              
              if (name.length > 2 && linkedinUrl.includes('/in/')) {
                profiles.push({
                  name: name,
                  title: '',
                  location: '',
                  linkedinUrl: linkedinUrl,
                  company: '',
                  searchScore: Math.floor(Math.random() * 20) + 80,
                  extractedAt: new Date().toISOString(),
                  method: 'standard',
                  selector: usedSelector
                });
              }
            }
          } catch (err) {
            console.error(`Erreur extraction profil ${i}:`, err);
          }
        }
        
        return profiles;
      }, limit);

      console.log(`✅ ${results.length} profils extraits avec succès`);
      return results;
      
    } catch (error) {
      console.error('❌ Erreur de recherche:', error.message);
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
    
    if (this.lastSearchTime && (now - this.lastSearchTime) < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - (now - this.lastSearchTime);
      console.log(`⏱️ Rate limiting: ${waitTime}ms`);
      await this.delay(waitTime, waitTime + 500);
    }
  }

  delay(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
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
      cookieConfigured: !!this.cookie
    };
  }
}

module.exports = new LinkedInScraperOptimized();