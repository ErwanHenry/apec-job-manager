/**
 * LinkedIn Google Scraper
 * Utilise Google Search pour trouver des profils LinkedIn publics
 * Contourne les protections LinkedIn en passant par Google
 */

const https = require('https');
const { URL } = require('url');

class LinkedInGoogleScraper {
  constructor() {
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 2000; // Plus court car on utilise Google, pas LinkedIn
    
    // User agents rotatifs pour éviter la détection
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    ];
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }
      
      console.log('🔍 Initialisation du scraper Google LinkedIn...');
      
      // Test Google Search pour vérifier l'accès
      const testQuery = 'site:linkedin.com/in/ test';
      const testResult = await this.makeGoogleRequest(testQuery);
      
      if (testResult.includes('captcha') || testResult.includes('unusual traffic')) {
        console.log('⚠️ Google détecte du trafic suspect, mais on continue...');
      }
      
      this.isInitialized = true;
      console.log('✅ Scraper Google LinkedIn initialisé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation Google:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Google LinkedIn scraper');
        }
      }
      
      this.dailySearchCount++;
      this.lastSearchTime = Date.now();
      
      console.log(`🔍 Recherche Google LinkedIn: "${query}" (${this.dailySearchCount}/${this.dailyLimit})`);

      // Construire plusieurs requêtes Google pour couvrir plus de profils
      const searchQueries = this.buildGoogleQueries(query, limit);
      
      let allProfiles = [];
      
      for (let i = 0; i < searchQueries.length && allProfiles.length < limit; i++) {
        try {
          console.log(`📡 Requête Google ${i + 1}/${searchQueries.length}: ${searchQueries[i]}`);
          
          const googleResults = await this.makeGoogleRequest(searchQueries[i]);
          const profiles = this.parseGoogleResults(googleResults, limit - allProfiles.length);
          
          console.log(`✅ ${profiles.length} profils trouvés via requête ${i + 1}`);
          allProfiles.push(...profiles);
          
          // Délai entre les requêtes pour éviter rate limiting
          if (i < searchQueries.length - 1) {
            await this.delay(this.rateLimitDelay);
          }
          
        } catch (error) {
          console.log(`⚠️ Erreur requête Google ${i + 1}:`, error.message);
        }
      }

      // Déduplication par LinkedIn ID
      const uniqueProfiles = this.deduplicateProfiles(allProfiles);
      
      console.log(`✅ ${uniqueProfiles.length} profils uniques extraits via Google`);
      return uniqueProfiles.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Erreur de recherche Google:', error.message);
      return [];
    }
  }

  buildGoogleQueries(query, limit) {
    const queries = [];
    
    // Lexique complet des commandes Google pour LinkedIn
    const googleCommands = [
      // Commandes de base très efficaces
      `site:linkedin.com/in/ "${query}"`,
      `site:linkedin.com "${query}"`,
      `inurl:linkedin.com/in "${query}"`,
      `intitle:"${query}" site:linkedin.com`,
      
      // Commandes avancées pour profils spécifiques
      `site:linkedin.com/in/ ${query}`,
      `inurl:linkedin.com/in/ ${query}`,
      `site:linkedin.com intext:"${query}"`,
      `intitle:"${query}" inurl:linkedin.com/in`,
      
      // Variations avec mots-clés métier
      `site:linkedin.com/in/ "${query}" "engineer"`,
      `site:linkedin.com/in/ "${query}" "developer"`,
      `site:linkedin.com/in/ "${query}" "software"`,
      `site:linkedin.com/in/ "${query}" "manager"`,
      
      // Commandes pour localisation
      `site:linkedin.com/in/ "${query}" "Paris"`,
      `site:linkedin.com/in/ "${query}" "France"`,
      `site:linkedin.com/in/ "${query}" "London"`,
      
      // Variations orthographiques et synonymes
      `site:linkedin.com/in/ (${query} OR "${this.generateSynonyms(query).join('" OR "')}")`,
      
      // Recherche par entreprise
      `site:linkedin.com/in/ "${query}" "Microsoft"`,
      `site:linkedin.com/in/ "${query}" "Google"`,
      `site:linkedin.com/in/ "${query}" "Apple"`,
      
      // Commandes de filtre avancées
      `site:linkedin.com/in/ "${query}" -"LinkedIn" -"Profile"`,
      `inurl:linkedin.com/in "${query}" filetype:html`,
      
      // Recherche par secteur d'activité
      `site:linkedin.com/in/ "${query}" "startup"`,
      `site:linkedin.com/in/ "${query}" "fintech"`,
      `site:linkedin.com/in/ "${query}" "SaaS"`
    ];
    
    // Sélectionner les 4-5 meilleures requêtes pour éviter rate limiting
    const bestQueries = [
      googleCommands[0], // site:linkedin.com/in/ avec guillemets (le plus précis)
      googleCommands[2], // inurl:linkedin.com/in (très efficace)
      googleCommands[1], // site:linkedin.com général
      googleCommands[8], // avec "engineer"
      googleCommands[16] // avec variations orthographiques
    ];
    
    queries.push(...bestQueries);
    
    return queries;
  }

  generateSynonyms(query) {
    const synonymMap = {
      'software engineer': ['software developer', 'programmer', 'coder', 'dev'],
      'engineer': ['developer', 'programmer', 'architect', 'specialist'],
      'developer': ['engineer', 'programmer', 'coder', 'dev'],
      'manager': ['director', 'lead', 'head', 'chief'],
      'cto': ['chief technology officer', 'technology director'],
      'ceo': ['chief executive officer', 'president', 'founder'],
      'frontend': ['front-end', 'ui', 'react', 'vue', 'angular'],
      'backend': ['back-end', 'server', 'api', 'database'],
      'fullstack': ['full-stack', 'full stack', 'fullstack developer'],
      'devops': ['dev ops', 'sre', 'platform engineer', 'infrastructure'],
      'data scientist': ['data analyst', 'ml engineer', 'ai engineer'],
      'product manager': ['pm', 'product owner', 'product lead']
    };
    
    const lowerQuery = query.toLowerCase();
    for (const [key, synonyms] of Object.entries(synonymMap)) {
      if (lowerQuery.includes(key)) {
        return synonyms;
      }
    }
    
    // Fallback: variations de base
    return [query.replace(' ', '-'), query.replace(' ', '_')];
  }

  async makeGoogleRequest(query) {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    const encodedQuery = encodeURIComponent(query);
    
    // URL Google Search avec paramètres pour avoir plus de résultats
    const googleUrl = `https://www.google.com/search?q=${encodedQuery}&num=20&hl=en&gl=us&start=0`;
    
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(googleUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  parseGoogleResults(html, limit) {
    const profiles = [];
    
    try {
      // Regex pour extraire les liens LinkedIn depuis les résultats Google
      const linkedinUrlRegex = /https:\/\/[a-z]{2,3}\.linkedin\.com\/in\/([a-zA-Z0-9\-]+)/g;
      const matches = [];
      let match;
      
      while ((match = linkedinUrlRegex.exec(html)) !== null && matches.length < limit * 3) {
        matches.push({
          url: match[0],
          linkedinId: match[1]
        });
      }
      
      // Extraire les informations de contexte pour chaque profil depuis Google
      for (const linkedinMatch of matches.slice(0, limit)) {
        try {
          const profile = this.extractProfileFromGoogleContext(html, linkedinMatch);
          if (profile) {
            profiles.push(profile);
          }
        } catch (error) {
          console.log('Erreur extraction profil Google:', error.message);
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du parsing Google:', error.message);
    }
    
    return profiles;
  }

  extractProfileFromGoogleContext(html, linkedinMatch) {
    try {
      // Chercher le contexte autour du lien LinkedIn dans le HTML Google
      const linkIndex = html.indexOf(linkedinMatch.url);
      if (linkIndex === -1) return null;
      
      // Extraire une zone de contexte autour du lien (2000 caractères avant et après)
      const contextStart = Math.max(0, linkIndex - 2000);
      const contextEnd = Math.min(html.length, linkIndex + 2000);
      const context = html.substring(contextStart, contextEnd);
      
      // Essayer d'extraire le nom depuis le titre ou la description Google
      let name = null;
      
      // Pattern 1: Titre Google (plus fiable)
      const titleMatch = context.match(/<h3[^>]*>([^<]+)<\/h3>/i);
      if (titleMatch) {
        name = titleMatch[1].trim();
        // Nettoyer le nom (enlever "- LinkedIn", etc.)
        name = name.replace(/\s*-\s*LinkedIn.*$/i, '').trim();
      }
      
      // Pattern 2: Description Google
      if (!name) {
        const descMatch = context.match(/<span[^>]*class="[^"]*st[^"]*"[^>]*>([^<]+)</i);
        if (descMatch) {
          const desc = descMatch[1].trim();
          // Extraire un nom probable du début de la description
          const nameMatch = desc.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/);
          if (nameMatch) {
            name = nameMatch[1];
          }
        }
      }
      
      // Pattern 3: Fallback depuis l'ID LinkedIn
      if (!name) {
        name = linkedinMatch.linkedinId
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
      
      // Extraire des informations supplémentaires du contexte
      let title = '';
      let location = '';
      
      // Chercher des mots-clés de poste dans le contexte
      const jobKeywords = ['engineer', 'developer', 'manager', 'director', 'CEO', 'CTO', 'architect', 'analyst'];
      for (const keyword of jobKeywords) {
        const keywordRegex = new RegExp(`\\b(\\w+\\s+)*${keyword}(\\s+\\w+)*`, 'gi');
        const jobMatch = context.match(keywordRegex);
        if (jobMatch) {
          title = jobMatch[0].trim();
          break;
        }
      }
      
      // Valider que c'est un profil réel
      if (!name || name.length < 3 || linkedinMatch.linkedinId.length < 3) {
        return null;
      }
      
      return {
        name: name,
        title: title,
        company: '', // Difficile à extraire depuis Google
        location: location,
        linkedinUrl: linkedinMatch.url,
        searchScore: 94, // Score élevé car trouvé via Google
        extractedAt: new Date().toISOString(),
        method: 'google-search',
        linkedinId: linkedinMatch.linkedinId,
        source: 'google'
      };
      
    } catch (error) {
      console.log('Erreur extraction contexte Google:', error.message);
      return null;
    }
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
      console.log(`⏱️ Rate limiting Google: ${waitTime}ms`);
      await this.delay(waitTime);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      method: 'google-search',
      description: 'Search LinkedIn profiles via Google'
    };
  }
}

module.exports = new LinkedInGoogleScraper();