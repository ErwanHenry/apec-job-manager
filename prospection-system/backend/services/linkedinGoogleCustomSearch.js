/**
 * LinkedIn Google Custom Search API Scraper
 * Utilise l'API Google Custom Search (payante mais officielle)
 */

const https = require('https');

class LinkedInGoogleCustomSearch {
  constructor() {
    this.isInitialized = false;
    this.apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    this.searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    this.dailySearchCount = 0;
    this.dailyLimit = 100; // API limit
  }

  async initialize() {
    try {
      console.log('🔍 Initialisation du Google Custom Search API...');
      
      if (!this.apiKey) {
        console.log('⚠️ GOOGLE_CUSTOM_SEARCH_API_KEY manquante dans .env');
        console.log('📋 Pour obtenir une clé API:');
        console.log('   1. Aller sur https://console.developers.google.com/');
        console.log('   2. Créer un projet et activer Custom Search API');
        console.log('   3. Créer une clé API');
        console.log('   4. Ajouter GOOGLE_CUSTOM_SEARCH_API_KEY=your_key dans .env');
        return false;
      }
      
      if (!this.searchEngineId) {
        console.log('⚠️ GOOGLE_CUSTOM_SEARCH_ENGINE_ID manquant dans .env');
        console.log('📋 Pour obtenir un Search Engine ID:');
        console.log('   1. Aller sur https://cse.google.com/');
        console.log('   2. Créer un moteur de recherche personnalisé');
        console.log('   3. Configurer pour rechercher sur linkedin.com');
        console.log('   4. Ajouter GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_id dans .env');
        return false;
      }
      
      // Test de l'API avec une requête simple
      const testResult = await this.makeCustomSearchRequest('test linkedin', 1);
      
      if (testResult.error) {
        console.log('❌ Erreur API:', testResult.error);
        return false;
      }
      
      console.log('✅ Google Custom Search API initialisé');
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Erreur initialisation Custom Search:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Google Custom Search API');
        }
      }
      
      console.log(`🔍 Recherche Custom Search API: "${query}"`);
      
      // Construire les requêtes optimisées pour LinkedIn
      const searchQueries = [
        `site:linkedin.com/in/ "${query}"`,
        `site:linkedin.com People ${query}`,
        `"${query}" site:linkedin.com`
      ];
      
      let allProfiles = [];
      
      for (const searchQuery of searchQueries) {
        if (allProfiles.length >= limit) break;
        
        try {
          console.log(`🔍 Requête API: ${searchQuery}`);
          
          const searchResult = await this.makeCustomSearchRequest(searchQuery, Math.min(10, limit - allProfiles.length));
          
          if (searchResult.error) {
            console.log(`⚠️ Erreur API: ${searchResult.error}`);
            continue;
          }
          
          if (searchResult.items) {
            const profiles = this.parseCustomSearchResults(searchResult.items, query);
            console.log(`✅ ${profiles.length} profils trouvés via Custom Search API`);
            allProfiles.push(...profiles);
          }
          
          // Respecter les limites d'API
          await this.delay(100); // 100ms entre requêtes
          
        } catch (error) {
          console.log(`⚠️ Erreur requête "${searchQuery}":`, error.message);
        }
      }
      
      const uniqueProfiles = this.deduplicateProfiles(allProfiles);
      console.log(`📈 ${uniqueProfiles.length} profils uniques via Google Custom Search`);
      
      return uniqueProfiles.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Erreur recherche Custom Search:', error.message);
      return [];
    }
  }

  async makeCustomSearchRequest(query, num = 10) {
    return new Promise((resolve, reject) => {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encodedQuery}&num=${num}`;
      
      const req = https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (parseError) {
            reject(parseError);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  parseCustomSearchResults(items, originalQuery) {
    const profiles = [];
    
    for (const item of items) {
      try {
        if (!item.link || !item.link.includes('linkedin.com/in/')) {
          continue;
        }
        
        // Extraire l'ID LinkedIn depuis l'URL
        const linkedinIdMatch = item.link.match(/linkedin\.com\/in\/([a-zA-Z0-9\-]+)/);
        if (!linkedinIdMatch) continue;
        
        const linkedinId = linkedinIdMatch[1];
        
        // Nom depuis le titre ou l'ID
        let name = item.title || linkedinId.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        // Nettoyer le nom
        name = name.replace(/\s*-\s*LinkedIn.*$/i, '').trim();
        
        // Extraire titre et entreprise depuis le snippet
        let title = 'Professional Profile';
        let company = '';
        let location = '';
        
        if (item.snippet) {
          // Patterns pour extraire info depuis le snippet Google
          const titleMatch = item.snippet.match(/(?:Senior|Lead|Principal|Staff|Head|Director|Manager|Engineer|Developer|Analyst)[^\.]+/i);
          if (titleMatch) {
            title = titleMatch[0].trim();
          }
          
          const companyMatch = item.snippet.match(/(?:at|chez|@)\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s*[\.|\-]|$)/);
          if (companyMatch) {
            company = companyMatch[1].trim();
          }
          
          const locationMatch = item.snippet.match(/\b(Paris|London|Berlin|Madrid|Milan|Amsterdam|Brussels|Zurich|Geneva|Lyon|Toulouse|Marseille)\b/i);
          if (locationMatch) {
            location = locationMatch[0];
          }
        }
        
        const profile = {
          name: name,
          title: title,
          company: company,
          location: location,
          linkedinUrl: item.link,
          searchScore: 98, // Score élevé car API officielle
          extractedAt: new Date().toISOString(),
          method: 'google-custom-search-api',
          linkedinId: linkedinId,
          source: 'google-custom-search',
          note: 'Profil extrait via Google Custom Search API (officielle)',
          snippet: item.snippet
        };
        
        profiles.push(profile);
        console.log(`✅ Profil Custom Search: ${name} (${linkedinId})`);
        
      } catch (error) {
        console.log(`⚠️ Erreur parsing item Custom Search:`, error.message);
        continue;
      }
    }
    
    return profiles;
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

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      hasApiKey: !!this.apiKey,
      hasSearchEngineId: !!this.searchEngineId,
      dailySearchCount: this.dailySearchCount,
      dailyLimit: this.dailyLimit,
      method: 'google-custom-search-api',
      description: 'Official Google Custom Search API (requires API key)'
    };
  }
}

module.exports = new LinkedInGoogleCustomSearch();