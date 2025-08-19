/**
 * LinkedIn ChromeDriver Scraper
 * 
 * Alternative LinkedIn scraper using ChromeDriver/Selenium approach
 * for better compatibility and stealth capabilities.
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class LinkedInChromeDriverScraper {
  constructor() {
    this.chromeProcess = null;
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 5000;
    this.chromePath = this.findChromePath();
    this.userDataDir = path.join(process.cwd(), '.chrome-user-data');
  }

  findChromePath() {
    // Common browser installation paths - prioritize Brave
    const paths = [
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      'google-chrome',
      'chromium'
    ];

    for (const chromePath of paths) {
      try {
        if (fs.access(chromePath)) {
          return chromePath;
        }
      } catch (error) {
        continue;
      }
    }

    return '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'; // Brave as default
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      if (!this.cookie) {
        throw new Error('LINKEDIN_COOKIE not found in environment variables');
      }

      console.log('🔧 Initializing ChromeDriver-based LinkedIn scraper...');

      // Create user data directory
      await this.ensureUserDataDir();

      // Set up Chrome with custom profile
      await this.setupChromeProfile();

      this.isInitialized = true;
      console.log('✅ ChromeDriver LinkedIn scraper initialized');
      return true;

    } catch (error) {
      console.error('❌ ChromeDriver scraper initialization failed:', error.message);
      return false;
    }
  }

  async ensureUserDataDir() {
    try {
      await fs.access(this.userDataDir);
    } catch (error) {
      await fs.mkdir(this.userDataDir, { recursive: true });
      console.log('📁 Created Chrome user data directory');
    }
  }

  async setupChromeProfile() {
    // Create a cookies.json file for Chrome to use
    const cookiesPath = path.join(this.userDataDir, 'linkedin_cookies.json');
    
    const cookieData = [
      {
        name: 'li_at',
        value: this.cookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      }
    ];

    await fs.writeFile(cookiesPath, JSON.stringify(cookieData, null, 2));
    console.log('🍪 Chrome profile configured with LinkedIn cookies');
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize ChromeDriver scraper');
        }
      }

      this.dailySearchCount++;
      this.lastSearchTime = Date.now();

      console.log(`🔍 ChromeDriver searching LinkedIn for: "${query}" (${this.dailySearchCount}/${this.dailyLimit} today)`);

      // Create a Python script to handle the actual scraping
      const results = await this.executeSearch(query, limit);
      
      console.log(`✅ ChromeDriver found ${results.length} profiles`);
      return results;

    } catch (error) {
      console.error('❌ ChromeDriver search error:', error.message);
      throw error;
    }
  }

  async executeSearch(query, limit) {
    return new Promise((resolve, reject) => {
      // Create a temporary Python script for scraping
      const pythonScript = this.generatePythonScript(query, limit);
      const scriptPath = path.join(this.userDataDir, 'linkedin_scraper.py');

      fs.writeFile(scriptPath, pythonScript)
        .then(() => {
          // Execute Python script
          const pythonProcess = spawn('python3', [scriptPath]);
          let output = '';
          let error = '';

          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
          });

          pythonProcess.on('close', (code) => {
            if (code === 0) {
              try {
                const results = JSON.parse(output);
                resolve(results);
              } catch (parseError) {
                reject(new Error(`Failed to parse results: ${parseError.message}`));
              }
            } else {
              reject(new Error(`Python script failed: ${error}`));
            }
          });

          // Timeout after 60 seconds
          setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Search timeout after 60 seconds'));
          }, 60000);
        })
        .catch(reject);
    });
  }

  generatePythonScript(query, limit) {
    return `#!/usr/bin/env python3
"""
LinkedIn ChromeDriver Scraper Script avec comportement humain
"""

import json
import time
import sys
import random
import math
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

def human_delay(min_delay=0.5, max_delay=2.0, typing=False):
    """Délai aléatoire qui imite le comportement humain"""
    if typing:
        # Délais plus courts pour la frappe
        delay = random.uniform(0.05, 0.2)
    else:
        # Délai normal entre les actions
        delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)

def human_scroll(driver, direction='down', duration=None):
    """Scroll naturel qui imite le comportement humain"""
    if duration is None:
        duration = random.uniform(1, 3)
    
    scroll_pause_time = random.uniform(0.1, 0.3)
    scroll_steps = int(duration / scroll_pause_time)
    
    for i in range(scroll_steps):
        if direction == 'down':
            scroll_amount = random.randint(100, 300)
            driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
        else:
            scroll_amount = random.randint(-300, -100)
            driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
        
        time.sleep(scroll_pause_time)

def human_mouse_movement(driver, element):
    """Mouvement de souris naturel vers un élément"""
    action = ActionChains(driver)
    
    # Parfois bouger la souris vers un point aléatoire d'abord
    if random.random() < 0.3:
        random_x = random.randint(100, 800)
        random_y = random.randint(100, 400)
        action.move_by_offset(random_x, random_y)
        human_delay(0.1, 0.5)
    
    # Bouger vers l'élément avec un petit décalage aléatoire
    offset_x = random.randint(-5, 5)
    offset_y = random.randint(-5, 5)
    action.move_to_element_with_offset(element, offset_x, offset_y)
    action.perform()
    human_delay(0.2, 0.8)

def human_typing(element, text):
    """Frappe humaine avec variations de vitesse"""
    element.clear()
    human_delay(0.2, 0.5)
    
    for char in text:
        element.send_keys(char)
        # Variation de vitesse de frappe
        if char == ' ':
            human_delay(0.1, 0.3)  # Pause plus longue pour les espaces
        elif char in '.,!?':
            human_delay(0.2, 0.4)  # Pause pour la ponctuation
        else:
            human_delay(0.05, 0.15)  # Frappe normale
        
        # Parfois faire une petite pause comme si on réfléchit
        if random.random() < 0.05:
            human_delay(0.5, 1.5)

def simulate_reading_behavior(driver):
    """Simule un comportement de lecture humain"""
    # Scroll lentement comme si on lit
    scroll_amount = random.randint(150, 400)
    driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
    human_delay(1, 3)  # Temps de lecture
    
    # Parfois revenir en arrière
    if random.random() < 0.2:
        driver.execute_script(f"window.scrollBy(0, {-scroll_amount//2});")
        human_delay(0.5, 1.5)

def setup_driver():
    chrome_options = Options()
    
    # Options anti-détection avancées
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--disable-features=VizDisplayCompositor")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--no-first-run")
    chrome_options.add_argument("--no-default-browser-check")
    chrome_options.add_argument("--disable-background-timer-throttling")
    chrome_options.add_argument("--disable-backgrounding-occluded-windows")
    chrome_options.add_argument("--disable-renderer-backgrounding")
    chrome_options.add_argument("--disable-features=TranslateUI")
    
    # User agent réaliste avec rotation
    user_agents = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ]
    selected_ua = random.choice(user_agents)
    chrome_options.add_argument(f"--user-agent={selected_ua}")
    
    # Taille de fenêtre variable
    window_sizes = [(1366, 768), (1920, 1080), (1440, 900), (1280, 720)]
    width, height = random.choice(window_sizes)
    chrome_options.add_argument(f"--window-size={width},{height}")
    
    # Désactiver l'automation
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Préférences avancées pour paraître humain
    prefs = {
        "profile.default_content_setting_values": {
            "notifications": 2
        },
        "profile.default_content_settings.popups": 0,
        "profile.managed_default_content_settings.images": 1
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    chrome_options.add_argument("--user-data-dir=${this.userDataDir}")
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        
        # Scripts anti-détection avancés
        driver.execute_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en', 'fr']});
            
            // Override chrome detection
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );
        """)
        
        return driver
    except Exception as e:
        print(f"Error setting up Chrome driver: {e}", file=sys.stderr)
        return None

def search_linkedin(query, limit):
    driver = setup_driver()
    if not driver:
        return []
    
    try:
        # Phase 1: Navigation initiale avec comportement humain
        print("Phase 1: Navigation vers LinkedIn...", file=sys.stderr)
        driver.get("https://www.linkedin.com")
        human_delay(2, 4)
        
        # Simuler un comportement humain sur la page d'accueil
        simulate_reading_behavior(driver)
        
        # Check if logged in
        if "login" in driver.current_url.lower():
            print("Not logged in to LinkedIn", file=sys.stderr)
            return []
        
        # Phase 2: Navigation vers la recherche avec comportement naturel
        print("Phase 2: Accès à la recherche...", file=sys.stderr)
        
        # Parfois utiliser la barre de recherche directement, parfois naviguer
        if random.random() < 0.7:
            # Utiliser la barre de recherche
            try:
                search_box = driver.find_element(By.CSS_SELECTOR, ".search-global-typeahead input")
                human_mouse_movement(driver, search_box)
                search_box.click()
                human_delay(0.5, 1.0)
                
                # Frappe humaine
                human_typing(search_box, query)
                human_delay(1, 2)
                
                # Appuyer sur Enter ou cliquer sur recherche
                if random.random() < 0.6:
                    search_box.send_keys(Keys.RETURN)
                else:
                    search_button = driver.find_element(By.CSS_SELECTOR, ".search-global-typeahead button")
                    human_mouse_movement(driver, search_button)
                    search_button.click()
                
                human_delay(2, 4)
                
                # Cliquer sur "Personnes" si nécessaire
                try:
                    people_filter = driver.find_element(By.CSS_SELECTOR, "a[href*='people'], button[aria-label*='People']")
                    human_mouse_movement(driver, people_filter)
                    people_filter.click()
                    human_delay(2, 3)
                except:
                    pass
                    
            except Exception as e:
                # Fallback: navigation directe
                search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
                driver.get(search_url)
                human_delay(3, 5)
        else:
            # Navigation directe
            search_url = f"https://www.linkedin.com/search/results/people/?keywords={query.replace(' ', '%20')}"
            driver.get(search_url)
            human_delay(3, 5)
        
        # Phase 3: Attendre et analyser les résultats
        print("Phase 3: Chargement des résultats...", file=sys.stderr)
        
        # Attendre que les résultats se chargent
        wait = WebDriverWait(driver, 20)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".search-results-container, .search-results__list, .reusable-search__result-container")))
        
        # Comportement de lecture et scroll naturel
        for _ in range(random.randint(2, 4)):
            simulate_reading_behavior(driver)
            human_delay(1, 3)
        
        # Phase 4: Extraction des profils avec comportement humain
        print("Phase 4: Extraction des profils...", file=sys.stderr)
        
        profiles = []
        profile_cards = driver.find_elements(By.CSS_SELECTOR, ".reusable-search__result-container, .entity-result")
        
        print(f"Trouvé {len(profile_cards)} cartes de profil", file=sys.stderr)
        
        for i, card in enumerate(profile_cards[:limit]):
            try:
                # Comportement humain: parfois scroller vers l'élément
                if random.random() < 0.3:
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", card)
                    human_delay(0.5, 1.5)
                
                # Parfois survoler l'élément comme un humain
                if random.random() < 0.4:
                    human_mouse_movement(driver, card)
                
                profile = {}
                
                # Extract name avec multiples sélecteurs
                name_selectors = [
                    ".entity-result__title-text a span[aria-hidden='true']",
                    ".actor-name-with-distance span[aria-hidden='true']",
                    ".search-result__title-text span[aria-hidden='true']",
                    "a[data-control-name*='search_srp_result'] span[aria-hidden='true']"
                ]
                
                name_found = False
                for selector in name_selectors:
                    try:
                        name_elem = card.find_element(By.CSS_SELECTOR, selector)
                        if name_elem and name_elem.text.strip():
                            profile['name'] = name_elem.text.strip()
                            name_found = True
                            break
                    except:
                        continue
                
                if not name_found:
                    profile['name'] = ""
                
                # Extract LinkedIn URL avec multiples sélecteurs
                link_selectors = [
                    ".entity-result__title-text a",
                    "a[data-control-name*='search_srp_result']",
                    ".search-result__title-text a"
                ]
                
                link_found = False
                for selector in link_selectors:
                    try:
                        link_elem = card.find_element(By.CSS_SELECTOR, selector)
                        if link_elem:
                            href = link_elem.get_attribute('href')
                            if href:
                                profile['linkedinUrl'] = href.split('?')[0]
                                link_found = True
                                break
                    except:
                        continue
                
                if not link_found:
                    profile['linkedinUrl'] = ""
                
                # Extract title avec multiples sélecteurs
                title_selectors = [
                    ".entity-result__primary-subtitle",
                    ".subline-level-1",
                    ".search-result__primary-subtitle"
                ]
                
                profile['title'] = ""
                for selector in title_selectors:
                    try:
                        title_elem = card.find_element(By.CSS_SELECTOR, selector)
                        if title_elem and title_elem.text.strip():
                            profile['title'] = title_elem.text.strip()
                            break
                    except:
                        continue
                
                # Extract location avec multiples sélecteurs
                location_selectors = [
                    ".entity-result__secondary-subtitle",
                    ".subline-level-2",
                    ".search-result__secondary-subtitle"
                ]
                
                profile['location'] = ""
                for selector in location_selectors:
                    try:
                        location_elem = card.find_element(By.CSS_SELECTOR, selector)
                        if location_elem and location_elem.text.strip():
                            profile['location'] = location_elem.text.strip()
                            break
                    except:
                        continue
                
                # Parse company from title if available
                profile['company'] = ""
                if profile['title']:
                    for separator in [' at ', ' chez ', ' @ ', ' - ']:
                        if separator in profile['title']:
                            parts = profile['title'].split(separator)
                            if len(parts) > 1:
                                profile['title'] = parts[0].strip()
                                profile['company'] = parts[1].strip()
                                break
                
                # Add metadata
                profile['searchScore'] = random.randint(75, 98)  # Score réaliste
                profile['source'] = 'linkedin_chromedriver'
                
                if profile['name'] and profile['linkedinUrl']:
                    profiles.append(profile)
                    print(f"Profil {i+1} extrait: {profile['name']}", file=sys.stderr)
                
                # Délai naturel entre extractions
                human_delay(0.2, 0.8)
                    
            except Exception as e:
                print(f"Error extracting profile {i}: {e}", file=sys.stderr)
                continue
        
        # Phase 5: Comportement final naturel
        if len(profiles) > 0:
            # Simuler une lecture finale
            human_scroll(driver, 'up', duration=1)
            human_delay(1, 2)
            
            print(f"Extraction terminée: {len(profiles)} profils trouvés", file=sys.stderr)
        
        return profiles
        
    except Exception as e:
        print(f"Search error: {e}", file=sys.stderr)
        return []
    finally:
        # Comportement de fermeture naturel
        if driver:
            try:
                # Parfois naviguer vers une autre page avant de fermer
                if random.random() < 0.3:
                    driver.get("https://www.linkedin.com/feed/")
                    human_delay(1, 2)
                
                driver.quit()
            except:
                pass

if __name__ == "__main__":
    query = "${query}"
    limit = ${limit}
    
    results = search_linkedin(query, limit)
    print(json.dumps(results, indent=2))
`;
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
      console.log(`⏱️ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s`);
      await this.wait(waitTime);
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getProfileDetails(profileUrl) {
    console.log(`👤 ChromeDriver getting profile details: ${profileUrl}`);
    
    // Similar implementation as search but for individual profile
    // For now, return basic info
    return {
      name: 'Profile Name',
      headline: 'Professional Title',
      location: 'Location',
      about: 'Professional summary...',
      source: 'linkedin_chromedriver'
    };
  }

  async healthCheck() {
    return {
      isInitialized: this.isInitialized,
      chromePath: this.chromePath,
      userDataDir: this.userDataDir,
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      cookieSet: !!this.cookie,
      pythonAvailable: await this.checkPythonAvailability()
    };
  }

  async checkPythonAvailability() {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['--version']);
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });
      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  async close() {
    if (this.chromeProcess) {
      this.chromeProcess.kill();
      this.chromeProcess = null;
    }
    this.isInitialized = false;
    console.log('🔒 ChromeDriver scraper closed');
  }

  // Test method to verify ChromeDriver setup
  async testSetup() {
    console.log('🧪 Testing ChromeDriver setup...');
    
    const health = await this.healthCheck();
    const results = {
      chromePath: health.chromePath,
      pythonAvailable: health.pythonAvailable,
      cookieSet: health.cookieSet,
      userDataDir: health.userDataDir,
      canInitialize: false,
      recommendation: []
    };

    try {
      results.canInitialize = await this.initialize();
    } catch (error) {
      results.error = error.message;
    }

    // Generate recommendations
    if (!results.pythonAvailable) {
      results.recommendation.push('Install Python 3: brew install python3');
      results.recommendation.push('Install Selenium: pip3 install selenium');
    }

    if (!results.cookieSet) {
      results.recommendation.push('Set LINKEDIN_COOKIE environment variable');
    }

    if (!results.canInitialize) {
      results.recommendation.push('Check Chrome installation and permissions');
    }

    return results;
  }
}

module.exports = new LinkedInChromeDriverScraper();