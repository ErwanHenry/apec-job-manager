/**
 * LinkedIn Real Scraper avec Puppeteer optimisé
 * Conçu pour récupérer de VRAIS profils LinkedIn existants
 */

const puppeteer = require('puppeteer');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

class LinkedInRealScraper {
  constructor() {
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.browser = null;
    this.page = null;
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

      console.log('🚀 Initialisation Puppeteer pour vrais profils LinkedIn...');

      // Configuration Puppeteer optimisée pour Mac Silicon
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--autoplay-policy=user-gesture-required',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 30000,
        protocolTimeout: 30000
      });

      this.page = await this.browser.newPage();

      // Configuration de la page
      await this.page.setViewport({ width: 1366, height: 768 });
      
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Désactiver images et CSS pour la vitesse
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Ajouter le cookie LinkedIn
      await this.page.setCookie({
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true
      });

      // Tester l'accès
      console.log('🔐 Test de connexion LinkedIn...');
      
      await this.page.goto('https://www.linkedin.com/feed/', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      // Vérifier si on est bien connecté
      await this.page.waitForTimeout(2000);
      const isLoggedIn = await this.page.evaluate(() => {
        return !document.body.innerHTML.includes('guest-homepage') && 
               !document.body.innerHTML.includes('session_key');
      });

      if (!isLoggedIn) {
        throw new Error('Échec de connexion LinkedIn - cookie invalide');
      }

      this.isInitialized = true;
      console.log('✅ Puppeteer LinkedIn initialisé avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur d\'initialisation Puppeteer:', error.message);
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
          throw new Error('Failed to initialize Puppeteer scraper');
        }
      }

      this.dailySearchCount++;
      console.log(`🔍 Recherche LinkedIn Puppeteer: "${query}" (${this.dailySearchCount}/${this.dailyLimit})`);

      // Aller à la page de recherche
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}&origin=GLOBAL_SEARCH_HEADER`;
      
      console.log('📄 Chargement de la page de recherche...');
      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Attendre que les résultats se chargent
      console.log('⏳ Attente du chargement des résultats...');
      
      try {
        await this.page.waitForSelector('[data-chameleon-result-urn]', { timeout: 15000 });
      } catch (error) {
        console.log('⚠️ Sélecteur principal non trouvé, tentative avec sélecteur alternatif...');
        try {
          await this.page.waitForSelector('.reusable-search__result-container', { timeout: 10000 });
        } catch (error2) {
          console.log('⚠️ Aucun sélecteur de résultat trouvé');
        }
      }

      // Extraire les profils
      const profiles = await this.page.evaluate((maxResults) => {
        const results = [];
        
        // Plusieurs sélecteurs possibles pour les profils
        const selectors = [
          '[data-chameleon-result-urn]',
          '.reusable-search__result-container',
          '.entity-result__item',
          '.search-result__wrapper'
        ];

        let profileElements = [];
        for (const selector of selectors) {
          profileElements = document.querySelectorAll(selector);
          if (profileElements.length > 0) {
            console.log(`Found ${profileElements.length} profiles with selector: ${selector}`);
            break;
          }
        }

        if (profileElements.length === 0) {
          console.log('No profile elements found with any selector');
          return [];
        }

        for (let i = 0; i < Math.min(profileElements.length, maxResults); i++) {
          const element = profileElements[i];
          
          try {
            // Extraire le nom
            const nameElement = element.querySelector('span[aria-hidden="true"]') || 
                               element.querySelector('.entity-result__title-text a span[aria-hidden="true"]') ||
                               element.querySelector('.actor-name-with-distance span[aria-hidden="true"]');
            
            const name = nameElement ? nameElement.textContent.trim() : null;

            // Extraire le lien LinkedIn
            const linkElement = element.querySelector('a[href*="/in/"]');
            const linkedinUrl = linkElement ? linkElement.href : null;

            // Extraire l'ID LinkedIn depuis l'URL
            const linkedinId = linkedinUrl ? linkedinUrl.match(/\/in\/([^\/\?]+)/)?.[1] : null;

            // Extraire le titre/poste
            const titleElement = element.querySelector('.entity-result__primary-subtitle') ||
                                element.querySelector('.actor-name-with-distance .actor-meta');
            const title = titleElement ? titleElement.textContent.trim() : '';

            // Extraire la localisation
            const locationElement = element.querySelector('.entity-result__secondary-subtitle') ||
                                   element.querySelector('.actor-name-with-distance .actor-meta-location');
            const location = locationElement ? locationElement.textContent.trim() : '';

            // Seulement ajouter si on a au moins un nom et un ID LinkedIn valide
            if (name && linkedinId && name !== 'LinkedIn Member') {
              results.push({
                name: name,
                title: title,
                company: '', // À extraire du titre si possible
                location: location,
                linkedinUrl: linkedinUrl,
                searchScore: 95,
                extractedAt: new Date().toISOString(),
                method: 'puppeteer-real',
                linkedinId: linkedinId
              });
            }
          } catch (error) {
            console.log('Error extracting profile:', error.message);
          }
        }

        return results;
      }, limit);

      console.log(`✅ ${profiles.length} vrais profils LinkedIn extraits`);
      
      if (profiles.length > 0) {
        console.log('📋 Premiers profils trouvés:');
        profiles.slice(0, 3).forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.name} (${profile.linkedinId})`);
        });
      }

      return profiles;

    } catch (error) {
      console.error('❌ Erreur de recherche Puppeteer:', error.message);
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
      method: 'puppeteer-real'
    };
  }
}

module.exports = new LinkedInRealScraper();