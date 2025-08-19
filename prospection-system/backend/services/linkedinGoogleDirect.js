/**
 * LinkedIn Google Direct Scraper
 * Fait des requêtes HTTP directes à Google avec rotation d'User Agents
 * et techniques anti-détection pour extraire de vrais profils LinkedIn
 */

const https = require('https');
const { URL } = require('url');

class LinkedInGoogleDirect {
  constructor() {
    this.isInitialized = false;
    this.requestCount = 0;
    
    // Pool d'User Agents réalistes et récents
    this.userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
    ];
    
    // Domaines Google internationaux pour rotation
    this.googleDomains = [
      'www.google.com',
      'www.google.fr',
      'www.google.co.uk',
      'www.google.de',
      'www.google.ca'
    ];
    
    // Headers pour paraître plus humain (sans compression pour simplifier)
    this.baseHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'identity', // Pas de compression
      'DNT': '1',
      'Connection': 'close',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache'
    };
  }

  async initialize() {
    try {
      console.log('🌐 Initialisation Google Direct Scraper - Requêtes HTTP optimisées');
      
      // Test de connectivité avec Google
      const testResult = await this.testGoogleAccess();
      
      if (testResult.success) {
        console.log('✅ Accès Google confirmé');
        this.isInitialized = true;
        return true;
      } else {
        console.log('❌ Impossible d\'accéder à Google');
        console.log(`⚠️ Erreur: ${testResult.error}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erreur initialisation Google Direct:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Google Direct scraper');
        }
      }

      console.log(`🔍 Recherche Google DIRECTE: "${query}"`);
      console.log('🎯 Extraction de VRAIS profils LinkedIn depuis Google');
      
      // Construire les requêtes Google optimisées
      const googleQueries = this.buildOptimizedQueries(query);
      
      let allProfiles = [];
      
      for (let i = 0; i < googleQueries.length && allProfiles.length < limit; i++) {
        const searchQuery = googleQueries[i];
        console.log(`🔍 Requête ${i + 1}/${googleQueries.length}: ${searchQuery}`);
        
        try {
          const profiles = await this.performDirectGoogleSearch(searchQuery, limit - allProfiles.length);
          
          if (profiles.length > 0) {
            console.log(`✅ ${profiles.length} VRAIS profils LinkedIn extraits`);
            allProfiles.push(...profiles);
          } else {
            console.log(`📊 Aucun profil pour: ${searchQuery.substring(0, 50)}...`);
          }
          
          // Délai intelligent entre requêtes
          if (i < googleQueries.length - 1) {
            const delay = this.calculateSmartDelay();
            console.log(`⏳ Délai anti-détection: ${delay}ms`);
            await this.sleep(delay);
          }
          
        } catch (error) {
          console.log(`⚠️ Erreur requête ${i + 1}:`, error.message);
        }
      }
      
      const uniqueProfiles = this.deduplicateProfiles(allProfiles);
      
      if (uniqueProfiles.length > 0) {
        console.log(`🎉 SUCCÈS: ${uniqueProfiles.length} VRAIS profils LinkedIn extraits de Google`);
        return uniqueProfiles.slice(0, limit);
      } else {
        console.log('🚫 Aucun vrai profil extrait de Google');
        console.log('💡 Causes possibles:');
        console.log('   - Rate limiting Google actif');
        console.log('   - Requête trop spécifique');
        console.log('   - Profils LinkedIn non indexés par Google');
        
        return [{
          name: 'AUCUN PROFIL TROUVÉ',
          title: 'Google ne retourne aucun résultat LinkedIn',
          company: 'Recherche trop spécifique ou rate limiting',
          location: 'N/A',
          linkedinUrl: 'https://linkedin.com',
          searchScore: 0,
          extractedAt: new Date().toISOString(),
          method: 'google-direct-no-results',
          linkedinId: 'no-results',
          source: 'google-direct',
          note: 'Aucun profil LinkedIn trouvé dans les résultats Google pour cette requête'
        }];
      }

    } catch (error) {
      console.error('❌ Erreur Google Direct:', error.message);
      
      return [{
        name: 'ERREUR GOOGLE DIRECT',
        title: 'Échec de la requête Google',
        company: 'Technical Error',
        location: 'N/A',
        linkedinUrl: 'https://google.com',
        searchScore: 0,
        extractedAt: new Date().toISOString(),
        method: 'google-direct-error',
        linkedinId: 'error',
        source: 'error',
        note: `Erreur technique: ${error.message}`
      }];
    }
  }

  buildOptimizedQueries(query) {
    // Requêtes Google TRÈS subtiles - sans mentionner LinkedIn explicitement
    return [
      `"${query}" "professional profile"`,
      `"${query}" "experience" "skills"`,
      `"${query}" "Paris" "professional"`,
      `"${query}" "profile" "work"`,
      `"${query}" "career" "Paris"`,
      `"${query}" intext:"years experience"`,
      `"${query}" "specialist" "expert"`
    ];
  }

  async performDirectGoogleSearch(query, maxResults) {
    try {
      // Sélectionner aléatoirement un domaine Google et User Agent
      const googleDomain = this.googleDomains[Math.floor(Math.random() * this.googleDomains.length)];
      const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
      
      // Construire l'URL Google
      const encodedQuery = encodeURIComponent(query);
      const googleUrl = `https://${googleDomain}/search?q=${encodedQuery}&num=20&hl=fr&gl=fr`;
      
      console.log(`📡 Requête: ${googleDomain} avec ${userAgent.split(' ')[0]}`);
      
      // Faire la requête HTTP
      const html = await this.makeHttpRequest(googleUrl, userAgent);
      
      if (html.includes('sorry') || html.includes('unusual traffic')) {
        console.log('🚫 Google rate limiting détecté');
        return [];
      }
      
      if (html.length < 1000) {
        console.log('⚠️ Réponse Google trop courte');
        return [];
      }
      
      console.log(`📊 Réponse Google reçue: ${html.length} caractères`);
      
      // Parser les profils LinkedIn depuis le HTML
      const profiles = this.parseLinkedInProfilesFromGoogle(html, query);
      
      return profiles.slice(0, maxResults);
      
    } catch (error) {
      console.log('❌ Erreur requête Google directe:', error.message);
      return [];
    }
  }

  async makeHttpRequest(url, userAgent) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          ...this.baseHeaders,
          'User-Agent': userAgent,
          'Host': urlObj.hostname
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
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

  parseLinkedInProfilesFromGoogle(html, originalQuery) {
    const profiles = [];
    
    try {
      console.log('🔍 Parsing HTML Google pour profils LinkedIn...');
      
      // Regex pour capturer les URLs LinkedIn
      const linkedinUrlRegex = /https:\/\/[a-z]{2,3}\.linkedin\.com\/in\/([a-zA-Z0-9\-]+)/g;
      const uniqueUrls = new Set();
      let match;
      
      while ((match = linkedinUrlRegex.exec(html)) !== null && uniqueUrls.size < 20) {
        const fullUrl = match[0];
        const linkedinId = match[1];
        
        if (linkedinId.length >= 3 && !linkedinId.includes('pub') && !linkedinId.includes('dir')) {
          uniqueUrls.add(JSON.stringify({
            url: fullUrl.split('?')[0], // Enlever les paramètres de tracking
            linkedinId: linkedinId
          }));
        }
      }
      
      console.log(`📊 ${uniqueUrls.size} URLs LinkedIn uniques détectées`);
      
      if (uniqueUrls.size === 0) {
        console.log('❌ Aucune URL LinkedIn trouvée dans les résultats Google');
        return [];
      }
      
      const urlArray = Array.from(uniqueUrls).map(item => JSON.parse(item));
      
      // Extraire les infos depuis le contexte Google pour chaque profil
      for (const urlData of urlArray.slice(0, 10)) {
        try {
          const profile = this.extractProfileFromGoogleContext(html, urlData, originalQuery);
          if (profile) {
            profiles.push(profile);
            console.log(`✅ Profil extrait: ${profile.name} (${profile.linkedinId})`);
          }
        } catch (error) {
          console.log(`⚠️ Erreur extraction ${urlData.linkedinId}:`, error.message);
          continue;
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing Google HTML:', error.message);
    }
    
    console.log(`📈 ${profiles.length} profils LinkedIn valides extraits`);
    return profiles;
  }

  extractProfileFromGoogleContext(html, urlData, originalQuery) {
    try {
      // Nom basé sur l'ID LinkedIn (fallback)
      let name = urlData.linkedinId
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      
      let title = 'Professional Profile';
      let company = '';
      let location = '';
      
      // Chercher le contexte autour de l'URL LinkedIn
      const urlIndex = html.indexOf(urlData.url);
      if (urlIndex !== -1) {
        const contextStart = Math.max(0, urlIndex - 2000);
        const contextEnd = Math.min(html.length, urlIndex + 2000);
        const context = html.substring(contextStart, contextEnd);
        
        // Patterns pour extraire les infos depuis Google
        const namePatterns = [
          /<h3[^>]*>([^<]+?)\s*(?:-\s*LinkedIn)?<\/h3>/i,
          /<span[^>]*>([^<]+?)\s*(?:-\s*LinkedIn)?<\/span>/i,
          /class="[^"]*title[^"]*"[^>]*>([^<]+?)<\/[^>]+>/i
        ];
        
        for (const pattern of namePatterns) {
          const nameMatch = context.match(pattern);
          if (nameMatch && nameMatch[1]) {
            const cleanName = nameMatch[1]
              .replace(/\s*-\s*LinkedIn.*$/i, '')
              .replace(/\s*\|\s*LinkedIn.*$/i, '')
              .replace(/&amp;/g, '&')
              .trim();
            if (cleanName.length > 2 && cleanName.length < 60 && !cleanName.includes('...')) {
              name = cleanName;
              break;
            }
          }
        }
        
        // Extraire titre professionnel
        const titlePatterns = [
          /(Senior|Lead|Principal|Staff|Head|Director|Manager|Engineer|Developer|Analyst|Consultant)[^<\n]*/i,
          /(?:at|chez|@)\s+([^<\n|•\-]{5,40})/i
        ];
        
        for (const pattern of titlePatterns) {
          const titleMatch = context.match(pattern);
          if (titleMatch && titleMatch[0]) {
            title = titleMatch[0].trim();
            break;
          }
        }
        
        // Extraire entreprise
        const companyPatterns = [
          /(?:at|chez|@)\s+([A-Z][a-zA-Z\s&.,]{2,30})(?:\s*[|•\-\n<]|$)/,
          /\b([A-Z][a-zA-Z&.,\s]{3,25}(?:Inc|Ltd|LLC|Corp|SA|SAS|SARL))\b/
        ];
        
        for (const pattern of companyPatterns) {
          const companyMatch = context.match(pattern);
          if (companyMatch && companyMatch[1]) {
            company = companyMatch[1].trim();
            break;
          }
        }
        
        // Extraire localisation
        if (originalQuery.toLowerCase().includes('paris')) {
          location = 'Paris, France';
        } else {
          const locationMatch = context.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);
          if (locationMatch) {
            location = locationMatch[1];
          }
        }
      }
      
      return {
        name: name,
        title: title,
        company: company,
        location: location,
        linkedinUrl: urlData.url,
        searchScore: 97,
        extractedAt: new Date().toISOString(),
        method: 'google-direct-real',
        linkedinId: urlData.linkedinId,
        source: 'google-search-direct',
        note: 'VRAI profil LinkedIn extrait directement des résultats Google'
      };
      
    } catch (error) {
      console.log(`❌ Erreur extraction contexte ${urlData.linkedinId}:`, error.message);
      return null;
    }
  }

  async testGoogleAccess() {
    try {
      const testUrl = 'https://www.google.com';
      const userAgent = this.userAgents[0];
      
      const html = await this.makeHttpRequest(testUrl, userAgent);
      
      // Validation plus souple de la réponse Google
      if (html.length > 1000 && (html.includes('Google') || html.includes('search') || html.includes('form'))) {
        return { success: true };
      } else {
        console.log(`⚠️ Réponse Google: ${html.length} caractères`);
        console.log(`⚠️ Début: ${html.substring(0, 200)}`);
        return { success: false, error: `Invalid response: ${html.length} chars, preview: ${html.substring(0, 100)}` };
      }
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  calculateSmartDelay() {
    // Délai intelligent basé sur l'heure et le nombre de requêtes
    const baseDelay = 3000;
    const randomFactor = Math.random() * 2000;
    const requestFactor = Math.min(this.requestCount * 500, 3000);
    
    this.requestCount++;
    
    return Math.floor(baseDelay + randomFactor + requestFactor);
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      requestCount: this.requestCount,
      method: 'google-direct',
      description: 'Direct HTTP requests to Google with anti-detection'
    };
  }
}

module.exports = new LinkedInGoogleDirect();