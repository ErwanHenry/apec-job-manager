/**
 * LinkedIn Real API Scraper
 * Utilise différents endpoints LinkedIn pour récupérer de vrais profils
 */

const https = require('https');
const { URL } = require('url');

class LinkedInRealApiScraper {
  constructor() {
    this.cookie = process.env.LINKEDIN_COOKIE;
    this.isInitialized = false;
    this.dailySearchCount = 0;
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT) || 50;
    this.lastSearchTime = null;
    this.rateLimitDelay = 5000; // Plus conservateur
    this.csrfToken = null;
    
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/vnd.linkedin.normalized+json+2.1',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'X-Restli-Protocol-Version': '2.0.0'
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
      
      console.log('🚀 Initialisation du scraper LinkedIn Real API...');
      
      // Test de connexion via API
      const testResult = await this.makeRequest('https://www.linkedin.com/voyager/api/me');
      
      if (testResult.includes('error') || testResult.includes('unauthorized')) {
        throw new Error('LinkedIn authentication failed via API');
      }
      
      this.isInitialized = true;
      console.log('✅ Scraper LinkedIn Real API initialisé avec succès');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur d\'initialisation Real API:', error.message);
      return false;
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      
      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          ...this.headers,
          'Cookie': `li_at=${this.cookie}`,
          'Referer': 'https://www.linkedin.com/',
          'Origin': 'https://www.linkedin.com',
          ...options.headers
        },
        timeout: 30000
      };

      const req = https.request(requestOptions, (res) => {
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

      if (options.data) {
        req.write(options.data);
      }
      
      req.end();
    });
  }

  async search(query, limit = 10) {
    try {
      await this.checkRateLimit();
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize LinkedIn Real API scraper');
        }
      }
      
      this.dailySearchCount++;
      this.lastSearchTime = Date.now();
      
      console.log(`🔍 Recherche LinkedIn Real API: "${query}" (${this.dailySearchCount}/${this.dailyLimit})`);

      // Essayer plusieurs endpoints LinkedIn API
      const endpoints = [
        // Endpoint 1: API de recherche Voyager
        `https://www.linkedin.com/voyager/api/search/hits?count=${limit}&filters=List(resultType-%3EPEOPLE)&keywords=${encodeURIComponent(query)}&origin=FACETED_SEARCH&q=all&start=0`,
        
        // Endpoint 2: API de suggestions
        `https://www.linkedin.com/voyager/api/typeahead/hits?count=${limit}&q=blended&query=${encodeURIComponent(query)}&types=List(PEOPLE)`,
        
        // Endpoint 3: API search clusters
        `https://www.linkedin.com/voyager/api/search/clusters?count=${limit}&keywords=${encodeURIComponent(query)}&origin=FACETED_SEARCH&q=all&filters=List(resultType-%3EPEOPLE)`
      ];

      let profiles = [];
      
      for (let i = 0; i < endpoints.length && profiles.length < limit; i++) {
        try {
          console.log(`📡 Tentative endpoint ${i + 1}/3...`);
          const response = await this.makeRequest(endpoints[i]);
          
          if (response.trim().startsWith('{')) {
            const apiData = JSON.parse(response);
            const extracted = this.parseApiResponse(apiData, limit - profiles.length);
            
            console.log(`✅ Endpoint ${i + 1}: ${extracted.length} profils extraits`);
            profiles.push(...extracted);
            
            if (extracted.length > 0) {
              break; // Si on a des résultats, pas besoin d'essayer les autres endpoints
            }
          }
          
        } catch (error) {
          console.log(`⚠️ Endpoint ${i + 1} failed: ${error.message}`);
        }
      }

      console.log(`✅ ${profiles.length} vrais profils LinkedIn trouvés via Real API`);
      return profiles;
      
    } catch (error) {
      console.error('❌ Erreur de recherche Real API:', error.message);
      return [];
    }
  }

  parseApiResponse(apiData, limit) {
    const profiles = [];
    
    try {
      // Parsing pour l'API Voyager search hits
      if (apiData.elements) {
        for (const element of apiData.elements.slice(0, limit)) {
          const profile = this.extractProfileFromElement(element);
          if (profile) {
            profiles.push(profile);
          }
        }
      }
      
      // Parsing pour l'API typeahead
      if (apiData.data && apiData.data.hits) {
        for (const hit of apiData.data.hits.slice(0, limit)) {
          const profile = this.extractProfileFromHit(hit);
          if (profile) {
            profiles.push(profile);
          }
        }
      }
      
      // Parsing pour clusters API
      if (apiData.clusters) {
        for (const cluster of apiData.clusters) {
          if (cluster.elements) {
            for (const element of cluster.elements.slice(0, limit - profiles.length)) {
              const profile = this.extractProfileFromElement(element);
              if (profile) {
                profiles.push(profile);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur lors du parsing API:', error.message);
    }
    
    return profiles;
  }

  extractProfileFromElement(element) {
    try {
      // Structure typique des éléments Voyager
      const hitInfo = element.hitInfo || {};
      const memberProfile = hitInfo['com.linkedin.voyager.search.SearchProfile'] || 
                           hitInfo['com.linkedin.voyager.typeahead.TypeaheadPerson'] ||
                           element;

      if (!memberProfile) return null;

      const miniProfile = memberProfile.miniProfile || memberProfile.profile || memberProfile;
      const publicIdentifier = miniProfile.publicIdentifier || miniProfile.entityUrn?.split(':').pop();
      
      if (!publicIdentifier || !miniProfile.firstName) return null;

      const name = `${miniProfile.firstName} ${miniProfile.lastName || ''}`.trim();
      const headline = memberProfile.headline || miniProfile.occupation || '';
      
      return {
        name: name,
        title: headline,
        company: '', // À extraire du headline si possible
        location: memberProfile.geoRegion || miniProfile.location || '',
        linkedinUrl: `https://www.linkedin.com/in/${publicIdentifier}/`,
        searchScore: 98, // Score élevé car c'est de l'API officielle
        extractedAt: new Date().toISOString(),
        method: 'linkedin-real-api',
        linkedinId: publicIdentifier
      };
    } catch (error) {
      console.log('Erreur extraction element:', error.message);
      return null;
    }
  }

  extractProfileFromHit(hit) {
    try {
      if (hit.type !== 'PERSON') return null;
      
      const person = hit.hitInfo || hit;
      const publicIdentifier = person.publicIdentifier || person.entityUrn?.split(':').pop();
      
      if (!publicIdentifier || !person.displayName) return null;

      return {
        name: person.displayName,
        title: person.subline || '',
        company: '',
        location: '',
        linkedinUrl: `https://www.linkedin.com/in/${publicIdentifier}/`,
        searchScore: 97,
        extractedAt: new Date().toISOString(),
        method: 'linkedin-typeahead-api',
        linkedinId: publicIdentifier
      };
    } catch (error) {
      console.log('Erreur extraction hit:', error.message);
      return null;
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
      cookieConfigured: !!this.cookie,
      method: 'linkedin-real-api'
    };
  }
}

module.exports = new LinkedInRealApiScraper();