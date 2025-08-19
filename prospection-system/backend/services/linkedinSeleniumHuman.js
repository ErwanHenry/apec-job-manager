/**
 * LinkedIn Selenium Human Behavior Scraper
 * Utilise Selenium avec simulation comportementale avancée pour contourner les protections anti-bot
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const UserAgent = require('user-agents');

class LinkedInSeleniumHuman {
  constructor() {
    this.driver = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.humanBehavior = {
      typingDelayMin: 50,
      typingDelayMax: 200,
      clickDelayMin: 500,
      clickDelayMax: 2000,
      scrollDelayMin: 1000,
      scrollDelayMax: 3000,
      readingDelayMin: 2000,
      readingDelayMax: 5000
    };
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      if (!this.cookie) {
        throw new Error('LINKEDIN_COOKIE not found');
      }

      console.log('🤖 Initialisation Selenium avec simulation humaine...');

      // Configuration Chrome ultra-réaliste
      const userAgent = new UserAgent();
      const chromeOptions = new chrome.Options();
      
      // Paramètres pour ressembler à un vrai utilisateur
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      chromeOptions.addArguments('--disable-extensions-file-access-check');
      chromeOptions.addArguments('--disable-extensions');
      chromeOptions.addArguments('--disable-plugins-discovery');
      chromeOptions.addArguments('--disable-preconnect');
      chromeOptions.addArguments('--disable-print-preview');
      chromeOptions.addArguments('--disable-web-security');
      chromeOptions.addArguments('--no-first-run');
      chromeOptions.addArguments('--no-service-autorun');
      chromeOptions.addArguments('--password-store=basic');
      chromeOptions.addArguments('--use-mock-keychain');
      chromeOptions.addArguments(`--user-agent=${userAgent.toString()}`);
      
      // Désactiver l'automation flag
      chromeOptions.excludeSwitches(['enable-automation']);
      chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
      
      // Viewport aléatoire réaliste
      const viewports = [
        [1366, 768], [1920, 1080], [1440, 900], [1536, 864], [1024, 768]
      ];
      const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
      chromeOptions.addArguments(`--window-size=${randomViewport[0]},${randomViewport[1]}`);

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      // Masquer les traces d'automation
      await this.driver.executeScript(`
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // Masquer Chrome DevTools
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
        };
        
        // Simuler plugins réalistes
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // Simuler langues réalistes
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'fr'],
        });
      `);

      // Aller sur LinkedIn avec comportement humain
      console.log('🌐 Navigation vers LinkedIn...');
      await this.driver.get('https://www.linkedin.com/');
      
      // Simulation de lecture de la page
      await this.humanDelay('reading');

      // Ajouter le cookie de session
      await this.driver.manage().addCookie({
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        secure: true,
        httpOnly: true
      });

      // Recharger avec le cookie
      await this.driver.navigate().refresh();
      await this.humanDelay('reading');

      // Vérifier qu'on est connecté
      console.log('🔐 Vérification de la connexion...');
      
      try {
        // Attendre un élément qui indique qu'on est connecté
        await this.driver.wait(
          until.elementLocated(By.css('[data-control-name="identity_welcome_message"], .global-nav__me, .feed-shared-update-v2')), 
          10000
        );
        console.log('✅ Connexion LinkedIn confirmée');
      } catch (error) {
        // Vérifier si on est sur une page de login
        const currentUrl = await this.driver.getCurrentUrl();
        if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
          throw new Error('Cookie LinkedIn invalide - redirection vers login');
        }
        console.log('⚠️ Éléments de connexion non trouvés, mais on continue...');
      }

      this.isInitialized = true;
      console.log('✅ Selenium Human initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Erreur d\'initialisation Selenium:', error.message);
      if (this.driver) {
        await this.driver.quit();
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
      console.log(`🔍 Recherche LinkedIn Selenium Human: "${query}" (${this.dailySearchCount}/${this.dailyLimit})`);

      // Navigation humaine vers la recherche
      console.log('🚶 Navigation humaine vers la recherche...');
      
      // Aller au feed d'abord (comportement naturel)
      await this.driver.get('https://www.linkedin.com/feed/');
      await this.humanDelay('reading');

      // Trouver et cliquer sur la barre de recherche avec comportement humain
      const searchBox = await this.driver.wait(
        until.elementLocated(By.css('.search-global-typeahead__input, input[placeholder*="Search"], .search-typeahead-v2__input')), 
        10000
      );

      // Comportement humain: d'abord cliquer, puis taper
      await this.humanClick(searchBox);
      await this.humanDelay('click');

      // Effacer le contenu existant si nécessaire
      await searchBox.clear();
      await this.humanDelay('typing');

      // Taper la requête de manière humaine
      await this.humanType(searchBox, query);
      await this.humanDelay('typing');

      // Appuyer sur Entrée de manière humaine
      await searchBox.sendKeys(Key.RETURN);
      await this.humanDelay('reading');

      // Attendre que la page de résultats se charge
      console.log('⏳ Attente des résultats de recherche...');
      
      try {
        await this.driver.wait(
          until.elementLocated(By.css('.search-results-container, .search-results__list, .reusable-search__result-container')), 
          15000
        );
      } catch (error) {
        console.log('⚠️ Conteneur de résultats principal non trouvé, recherche d\'éléments alternatifs...');
      }

      // Cliquer sur l'onglet "People" si nécessaire
      try {
        const peopleTab = await this.driver.findElement(
          By.css('button[aria-label*="People"], .search-vertical-filter__filter[data-vertical="PEOPLE"]')
        );
        await this.humanClick(peopleTab);
        await this.humanDelay('reading');
        console.log('✅ Filtré sur les profils personnes');
      } catch (error) {
        console.log('⚠️ Onglet People non trouvé, on continue...');
      }

      // Simulation de scroll humain pour charger plus de résultats
      await this.humanScroll();

      // Extraire les profils avec comportement humain
      const profiles = await this.extractProfilesHuman(limit);

      console.log(`✅ ${profiles.length} profils extraits via Selenium Human`);
      return profiles;

    } catch (error) {
      console.error('❌ Erreur de recherche Selenium Human:', error.message);
      return [];
    }
  }

  async extractProfilesHuman(limit) {
    const profiles = [];
    
    try {
      console.log('🕵️ Extraction humaine des profils...');

      // Sélecteurs multiples pour les cartes de profil
      const profileSelectors = [
        '.reusable-search__result-container',
        '.search-result__wrapper',
        '.entity-result',
        '[data-chameleon-result-urn]',
        '.search-result'
      ];

      let profileElements = [];
      
      // Essayer différents sélecteurs
      for (const selector of profileSelectors) {
        try {
          profileElements = await this.driver.findElements(By.css(selector));
          if (profileElements.length > 0) {
            console.log(`✅ Trouvé ${profileElements.length} profils avec sélecteur: ${selector}`);
            break;
          }
        } catch (error) {
          console.log(`⚠️ Sélecteur ${selector} failed:`, error.message);
        }
      }

      if (profileElements.length === 0) {
        console.log('❌ Aucun élément de profil trouvé');
        return profiles;
      }

      // Extraire chaque profil avec comportement humain
      for (let i = 0; i < Math.min(profileElements.length, limit); i++) {
        try {
          const element = profileElements[i];
          
          // Simuler le regard humain sur chaque profil
          await this.driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
          await this.humanDelay('reading');

          const profile = await this.extractSingleProfile(element);
          if (profile) {
            profiles.push(profile);
            console.log(`   ${profiles.length}. ${profile.name} (${profile.linkedinId})`);
          }

          // Délai entre chaque extraction
          await this.humanDelay('reading');

        } catch (error) {
          console.log(`⚠️ Erreur extraction profil ${i + 1}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction:', error.message);
    }

    return profiles;
  }

  async extractSingleProfile(element) {
    try {
      // Extraire le nom
      const nameSelectors = [
        '.entity-result__title-text a span[aria-hidden="true"]',
        '.actor-name-with-distance span[aria-hidden="true"]',
        '.search-result__title a span[aria-hidden="true"]',
        'span[aria-hidden="true"]'
      ];

      let name = null;
      for (const selector of nameSelectors) {
        try {
          const nameElement = await element.findElement(By.css(selector));
          name = await nameElement.getText();
          if (name && name.trim().length > 0) break;
        } catch (error) {
          continue;
        }
      }

      // Extraire l'URL LinkedIn
      const linkSelectors = [
        'a[href*="/in/"]',
        '.entity-result__title-text a',
        '.search-result__title a'
      ];

      let linkedinUrl = null;
      let linkedinId = null;
      
      for (const selector of linkSelectors) {
        try {
          const linkElement = await element.findElement(By.css(selector));
          linkedinUrl = await linkElement.getAttribute('href');
          if (linkedinUrl && linkedinUrl.includes('/in/')) {
            const match = linkedinUrl.match(/\/in\/([^\/\?]+)/);
            if (match) {
              linkedinId = match[1];
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Extraire le titre
      const titleSelectors = [
        '.entity-result__primary-subtitle',
        '.actor-name-with-distance .actor-meta',
        '.search-result__subtitle'
      ];

      let title = '';
      for (const selector of titleSelectors) {
        try {
          const titleElement = await element.findElement(By.css(selector));
          title = await titleElement.getText();
          if (title && title.trim().length > 0) break;
        } catch (error) {
          continue;
        }
      }

      // Extraire la localisation
      const locationSelectors = [
        '.entity-result__secondary-subtitle',
        '.actor-name-with-distance .actor-meta-location',
        '.search-result__metadata'
      ];

      let location = '';
      for (const selector of locationSelectors) {
        try {
          const locationElement = await element.findElement(By.css(selector));
          location = await locationElement.getText();
          if (location && location.trim().length > 0) break;
        } catch (error) {
          continue;
        }
      }

      // Valider que c'est un profil réel
      if (!name || !linkedinId || name === 'LinkedIn Member') {
        return null;
      }

      return {
        name: name.trim(),
        title: title.trim(),
        company: '', // À extraire du titre si possible
        location: location.trim(),
        linkedinUrl: linkedinUrl,
        searchScore: 99, // Score élevé car extraction Selenium
        extractedAt: new Date().toISOString(),
        method: 'selenium-human',
        linkedinId: linkedinId
      };

    } catch (error) {
      console.log('Erreur extraction profil individuel:', error.message);
      return null;
    }
  }

  // Méthodes de simulation comportementale humaine

  async humanDelay(type) {
    const delays = this.humanBehavior;
    let min, max;

    switch (type) {
      case 'typing':
        min = delays.typingDelayMin;
        max = delays.typingDelayMax;
        break;
      case 'click':
        min = delays.clickDelayMin;
        max = delays.clickDelayMax;
        break;
      case 'scroll':
        min = delays.scrollDelayMin;
        max = delays.scrollDelayMax;
        break;
      case 'reading':
        min = delays.readingDelayMin;
        max = delays.readingDelayMax;
        break;
      default:
        min = 500;
        max = 1500;
    }

    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.sleep(delay);
  }

  async humanType(element, text) {
    // Taper caractère par caractère avec délais variables
    for (const char of text) {
      await element.sendKeys(char);
      await this.sleep(Math.random() * 150 + 50); // 50-200ms entre les caractères
    }
  }

  async humanClick(element) {
    // Mouvement de souris simulé avant le clic
    await this.driver.actions()
      .move({ origin: element })
      .pause(Math.random() * 500 + 200)
      .click()
      .perform();
  }

  async humanScroll() {
    // Scroll graduel pour simuler la lecture
    for (let i = 0; i < 3; i++) {
      await this.driver.executeScript('window.scrollBy(0, window.innerHeight * 0.3);');
      await this.humanDelay('scroll');
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
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
      method: 'selenium-human'
    };
  }
}

module.exports = new LinkedInSeleniumHuman();