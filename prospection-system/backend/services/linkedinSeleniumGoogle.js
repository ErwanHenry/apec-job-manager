/**
 * LinkedIn Selenium Google Scraper
 * Utilise Selenium pour simuler un comportement humain sur Google
 * et faire de vraies recherches site:linkedin.com
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class LinkedInSeleniumGoogle {
  constructor() {
    this.driver = null;
    this.isInitialized = false;
    this.searchCount = 0;
    this.humanDelayMin = 2000;
    this.humanDelayMax = 5000;
  }

  async initialize() {
    try {
      console.log('🤖 Initialisation Selenium pour Google - Simulation comportement humain');
      
      // Configuration Chrome optimisée et headless
      const chromeOptions = new chrome.Options();
      chromeOptions.addArguments('--headless'); // Mode sans interface
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-gpu');
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      chromeOptions.excludeSwitches(['enable-automation']);
      chromeOptions.addArguments('--disable-extensions');
      chromeOptions.addArguments('--disable-images'); // Plus rapide
      chromeOptions.addArguments('--window-size=1366,768');
      
      // Créer le driver avec timeout
      console.log('🚀 Création du driver Chrome...');
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();
      
      // Configurer les timeouts
      await this.driver.manage().setTimeouts({
        implicit: 10000, // 10 secondes
        pageLoad: 30000, // 30 secondes
        script: 20000    // 20 secondes
      });
      
      console.log('✅ Driver Selenium initialisé');
      
      // Test d'accès à Google
      await this.driver.get('https://www.google.com');
      await this.humanDelay();
      
      const title = await this.driver.getTitle();
      if (title.includes('Google')) {
        console.log('✅ Accès Google réussi');
        this.isInitialized = true;
        return true;
      } else {
        console.log('❌ Impossible d\'accéder à Google');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation Selenium:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Selenium Google scraper');
        }
      }

      console.log(`🔍 Recherche Google RÉELLE avec Selenium: "${query}"`);
      console.log('🤖 Simulation comportement humain activée');
      
      // Construire les requêtes Google pour LinkedIn
      const googleQueries = [
        `site:linkedin.com/in/ "${query}"`,
        `site:linkedin.com People ${query}`,
        `"${query}" site:linkedin.com`
      ];
      
      let allProfiles = [];
      
      for (let i = 0; i < googleQueries.length && allProfiles.length < limit; i++) {
        const searchQuery = googleQueries[i];
        console.log(`🔍 Requête Google ${i + 1}/${googleQueries.length}: ${searchQuery}`);
        
        try {
          const profiles = await this.performGoogleSearch(searchQuery, limit - allProfiles.length);
          
          if (profiles.length > 0) {
            console.log(`✅ ${profiles.length} profils LinkedIn trouvés via Google`);
            allProfiles.push(...profiles);
          } else {
            console.log(`📊 Aucun profil trouvé pour: ${searchQuery}`);
          }
          
          // Délai humain entre les recherches
          if (i < googleQueries.length - 1) {
            console.log('⏳ Délai humain entre les recherches...');
            await this.humanDelay(3000, 6000);
          }
          
        } catch (error) {
          console.log(`⚠️ Erreur recherche "${searchQuery}":`, error.message);
        }
      }
      
      const uniqueProfiles = this.deduplicateProfiles(allProfiles);
      
      console.log(`📈 ${uniqueProfiles.length} profils LinkedIn uniques extraits via Selenium Google`);
      return uniqueProfiles.slice(0, limit);

    } catch (error) {
      console.error('❌ Erreur Selenium Google:', error.message);
      
      return [{
        name: 'ERREUR SELENIUM',
        title: 'Échec du scraping Google',
        company: 'System Error',
        location: 'N/A',
        linkedinUrl: 'https://linkedin.com',
        searchScore: 0,
        extractedAt: new Date().toISOString(),
        method: 'selenium-google-error',
        linkedinId: 'error',
        source: 'error',
        note: `Erreur Selenium: ${error.message}`
      }];
    }
  }

  async performGoogleSearch(query, maxResults) {
    try {
      // Aller sur Google
      await this.driver.get('https://www.google.com');
      await this.humanDelay();
      
      // Trouver la barre de recherche
      const searchBox = await this.driver.findElement(By.name('q'));
      
      // Effacer et taper la requête avec simulation humaine
      await searchBox.clear();
      await this.humanType(searchBox, query);
      
      // Attendre un peu comme un humain
      await this.humanDelay(500, 1500);
      
      // Appuyer sur Entrée
      await searchBox.sendKeys(Key.RETURN);
      
      // Attendre que les résultats se chargent
      await this.driver.wait(until.titleContains(query.substring(0, 20)), 10000);
      await this.humanDelay(2000, 4000);
      
      // Extraire les URLs LinkedIn depuis les résultats
      const profiles = await this.extractLinkedInProfilesFromResults(maxResults);
      
      return profiles;
      
    } catch (error) {
      console.log('❌ Erreur recherche Google:', error.message);
      
      // Vérifier si Google nous bloque
      const currentUrl = await this.driver.getCurrentUrl();
      if (currentUrl.includes('sorry') || currentUrl.includes('unusual')) {
        console.log('🚫 Google a détecté l\'automation et nous bloque');
        console.log('💡 Solutions:');
        console.log('   - Utiliser un VPN différent');
        console.log('   - Attendre quelques heures');
        console.log('   - Utiliser des proxies rotatifs');
      }
      
      return [];
    }
  }

  async extractLinkedInProfilesFromResults(maxResults) {
    const profiles = [];
    
    try {
      // Chercher tous les liens dans les résultats de recherche
      const links = await this.driver.findElements(By.css('a[href*="linkedin.com/in/"]'));
      
      console.log(`🔗 ${links.length} liens LinkedIn détectés dans les résultats Google`);
      
      for (let i = 0; i < Math.min(links.length, maxResults); i++) {
        try {
          const link = links[i];
          const href = await link.getAttribute('href');
          
          if (href && href.includes('linkedin.com/in/')) {
            // Extraire l'ID LinkedIn
            const linkedinIdMatch = href.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/);
            if (linkedinIdMatch) {
              const linkedinId = linkedinIdMatch[1];
              
              // Essayer d'extraire le nom depuis le texte du lien
              let name = linkedinId.split('-').map(part => 
                part.charAt(0).toUpperCase() + part.slice(1)
              ).join(' ');
              
              try {
                const linkText = await link.getText();
                if (linkText && linkText.length > 2 && linkText.length < 50) {
                  name = linkText.replace(/\s*-\s*LinkedIn.*$/i, '').trim();
                }
              } catch (textError) {
                // Utiliser le nom basé sur l'ID si extraction du texte échoue
              }
              
              // Essayer d'extraire plus d'infos depuis le contexte
              let title = 'Professional Profile';
              let company = '';
              
              try {
                const parentElement = await link.findElement(By.xpath('..'));
                const contextText = await parentElement.getText();
                
                // Chercher titre et entreprise dans le contexte
                const titleMatch = contextText.match(/(Senior|Lead|Principal|Manager|Director|Engineer|Developer|Analyst)[^\n]*/i);
                if (titleMatch) {
                  title = titleMatch[0].trim();
                }
                
                const companyMatch = contextText.match(/(?:at|chez|@)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s*[|•\-\n]|$)/);
                if (companyMatch) {
                  company = companyMatch[1].trim();
                }
              } catch (contextError) {
                // Ignorer si extraction du contexte échoue
              }
              
              const profile = {
                name: name,
                title: title,
                company: company,
                location: '',
                linkedinUrl: href.split('?')[0], // Enlever les paramètres de tracking
                searchScore: 98, // Score élevé car extraction directe de Google
                extractedAt: new Date().toISOString(),
                method: 'selenium-google-real',
                linkedinId: linkedinId,
                source: 'google-search-selenium',
                note: 'Profil réel extrait de Google via Selenium avec comportement humain'
              };
              
              profiles.push(profile);
              console.log(`✅ Profil extrait: ${name} (${linkedinId})`);
            }
          }
          
        } catch (linkError) {
          console.log(`⚠️ Erreur extraction lien ${i}:`, linkError.message);
          continue;
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur extraction profils:', error.message);
    }
    
    return profiles;
  }

  async humanType(element, text) {
    // Simulation de frappe humaine avec délais variables
    for (const char of text) {
      await element.sendKeys(char);
      await this.sleep(Math.random() * 150 + 50); // 50-200ms entre chaque caractère
    }
  }

  async humanDelay(minMs = null, maxMs = null) {
    const min = minMs || this.humanDelayMin;
    const max = maxMs || this.humanDelayMax;
    const delay = Math.random() * (max - min) + min;
    await this.sleep(delay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  deduplicateProfiles(profiles) {
    const seen = new Set();
    return profiles.filter(profile => {
      if (seen.has(profile.linkedinId)) {
        return false;
      }
      seen.add(profile.linkedinId);
      return true;
    });
  }

  async close() {
    try {
      if (this.driver) {
        await this.driver.quit();
        console.log('✅ Driver Selenium fermé');
      }
    } catch (error) {
      console.log('⚠️ Erreur fermeture Selenium:', error.message);
    }
    
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      method: 'selenium-google',
      description: 'Google search with Selenium human behavior simulation',
      searchCount: this.searchCount
    };
  }
}

module.exports = new LinkedInSeleniumGoogle();