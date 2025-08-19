/**
 * LinkedIn Selenium Optimized Human Scraper
 * Version optimisée avec gestion des timeouts et mode headless
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class LinkedInSeleniumOptimized {
  constructor() {
    this.driver = null;
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

      console.log('🚀 Initialisation Selenium optimisé...');

      // Configuration Chrome optimisée pour la vitesse
      const chromeOptions = new chrome.Options();
      
      // Mode headless pour la vitesse
      chromeOptions.addArguments('--headless=new');
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-gpu');
      chromeOptions.addArguments('--disable-extensions');
      chromeOptions.addArguments('--disable-images');
      chromeOptions.addArguments('--disable-javascript'); // On le réactivera si nécessaire
      chromeOptions.addArguments('--disable-plugins');
      chromeOptions.addArguments('--disable-java');
      chromeOptions.addArguments('--disable-web-security');
      chromeOptions.addArguments('--window-size=1366,768');
      
      // User agent réaliste
      chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Anti-détection basique
      chromeOptions.excludeSwitches(['enable-automation']);
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');

      // Timeouts réduits
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      // Timeouts globaux
      await this.driver.manage().setTimeouts({
        implicit: 5000,
        pageLoad: 15000,
        script: 10000
      });

      console.log('🌐 Navigation rapide vers LinkedIn...');
      
      // Navigation directe
      await this.driver.get('https://www.linkedin.com/login');
      
      // Ajouter le cookie immédiatement
      await this.driver.manage().addCookie({
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        secure: true,
        httpOnly: true
      });

      // Aller directement à la recherche
      await this.driver.get('https://www.linkedin.com/search/results/people/');
      
      // Vérification rapide de connexion
      try {
        await this.driver.wait(
          until.elementLocated(By.css('input[placeholder*="Search"], .search-global-typeahead__input')), 
          8000
        );
        console.log('✅ Connexion LinkedIn confirmée');
      } catch (error) {
        console.log('⚠️ Vérification de connexion échouée, on continue...');
      }

      this.isInitialized = true;
      console.log('✅ Selenium optimisé initialisé');
      return true;

    } catch (error) {
      console.error('❌ Erreur d\'initialisation Selenium:', error.message);
      if (this.driver) {
        await this.driver.quit().catch(() => {});
      }
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Selenium scraper');
        }
      }

      this.dailySearchCount++;
      console.log(`🔍 Recherche Selenium optimisé: "${query}"`);

      // URL de recherche directe
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
      await this.driver.get(searchUrl);

      // Attendre les résultats avec timeout court
      try {
        await this.driver.wait(
          until.elementLocated(By.css('.reusable-search__result-container, .entity-result, .search-result')), 
          10000
        );
      } catch (error) {
        console.log('⚠️ Timeout sur les résultats, tentative d\'extraction...');
      }

      // Scroll rapide pour charger plus de résultats
      await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight/2);');
      await this.sleep(2000);

      // Extraction rapide
      const profiles = await this.extractProfilesFast(limit);

      console.log(`✅ ${profiles.length} profils extraits`);
      return profiles;

    } catch (error) {
      console.error('❌ Erreur de recherche Selenium:', error.message);
      return [];
    }
  }

  async extractProfilesFast(limit) {
    const profiles = [];
    
    try {
      // Script d'extraction côté client pour la vitesse
      const extractionScript = `
        const profiles = [];
        const maxProfiles = ${limit};
        
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
              const match = linkedinUrl.match(/\\/in\\/([^\\/\\?]+)/);
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
              profiles.push({
                name: name,
                title: title,
                company: '',
                location: location,
                linkedinUrl: linkedinUrl,
                searchScore: 95,
                extractedAt: new Date().toISOString(),
                method: 'selenium-optimized',
                linkedinId: linkedinId
              });
            }
          } catch (error) {
            console.log('Erreur extraction profil:', error.message);
          }
        }
        
        return profiles;
      `;

      const extractedProfiles = await this.driver.executeScript(extractionScript);
      
      if (Array.isArray(extractedProfiles)) {
        profiles.push(...extractedProfiles);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction rapide:', error.message);
    }

    return profiles;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.driver) {
      try {
        await this.driver.quit();
      } catch (error) {
        console.log('⚠️ Erreur lors de la fermeture:', error.message);
      }
      this.driver = null;
      this.isInitialized = false;
    }
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      cookieConfigured: !!this.cookie,
      method: 'selenium-optimized'
    };
  }
}

module.exports = new LinkedInSeleniumOptimized();