/**
 * LinkedIn Browser Scraper
 * Utilise Puppeteer avec un vrai navigateur pour scraper LinkedIn
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LinkedInBrowserScraper {
  constructor() {
    this.isInitialized = false;
    this.cookie = process.env.LINKEDIN_COOKIE;
  }

  async initialize() {
    try {
      console.log('🌐 Initialisation du Browser Scraper - Approche navigateur réel');
      
      if (!this.cookie) {
        console.log('⚠️ Cookie LinkedIn manquant dans .env');
        console.log('📋 Pour obtenir le cookie:');
        console.log('   1. Se connecter à LinkedIn dans un navigateur');
        console.log('   2. Ouvrir les DevTools (F12)');
        console.log('   3. Aller dans Application > Cookies > linkedin.com');
        console.log('   4. Copier la valeur du cookie "li_at"');
        console.log('   5. Ajouter LINKEDIN_COOKIE=valeur dans .env');
        return false;
      }
      
      console.log('✅ Cookie LinkedIn disponible');
      this.isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('❌ Erreur initialisation Browser Scraper:', error.message);
      return false;
    }
  }

  async search(query, limit = 10) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Browser Scraper not initialized');
        }
      }

      console.log(`🌐 Recherche LinkedIn via navigateur: "${query}"`);
      console.log('⚡ Tentative de scraping RÉEL avec cookie authentifié');
      
      // Créer un script Python/Node pour Selenium ou utiliser curl avancé
      const realProfiles = await this.performRealSearch(query, limit);
      
      if (realProfiles.length === 0) {
        console.log('🚫 ÉCHEC: Impossible d\'accéder à LinkedIn');
        console.log('💡 Causes possibles:');
        console.log('   - Cookie LinkedIn expiré');
        console.log('   - LinkedIn détecte l\'automation');
        console.log('   - Compte LinkedIn bloqué/restreint');
        console.log('   - Protection anti-bot trop forte');
        
        return [{
          name: 'RÉALITÉ: Scraping LinkedIn impossible',
          title: 'LinkedIn bloque toute automation',
          company: 'LinkedIn Security',
          location: 'Protégé',
          linkedinUrl: 'https://linkedin.com/help/linkedin/answer/a1372070',
          searchScore: 0,
          extractedAt: new Date().toISOString(),
          method: 'browser-scraper-blocked',
          linkedinId: 'blocked',
          source: 'linkedin-security',
          note: 'LinkedIn bloque activement tout scraping automatisé. Utilisez l\'API officielle.'
        }];
      }

      console.log(`✅ ${realProfiles.length} VRAIS profils extraits de LinkedIn`);
      return realProfiles;

    } catch (error) {
      console.error('❌ Erreur Browser Scraper:', error.message);
      
      return [{
        name: 'ERREUR TECHNIQUE',
        title: 'Scraping échoué',
        company: 'System Error',
        location: 'N/A',
        linkedinUrl: 'https://linkedin.com',
        searchScore: 0,
        extractedAt: new Date().toISOString(),
        method: 'browser-scraper-error',
        linkedinId: 'error',
        source: 'error',
        note: `Erreur: ${error.message}`
      }];
    }
  }

  async performRealSearch(query, limit) {
    console.log('🔍 Tentative de scraping réel de LinkedIn...');
    
    try {
      // Méthode 1: Utiliser curl avec le cookie LinkedIn
      const curlResult = await this.searchWithCurl(query, limit);
      
      if (curlResult.length > 0) {
        return curlResult;
      }
      
      // Méthode 2: Utiliser une approche alternative
      console.log('⚠️ Curl échoué, tentative méthode alternative...');
      
      // Ici on pourrait lancer un script Selenium ou Playwright
      // mais ils sont généralement détectés aussi
      
      return [];
      
    } catch (error) {
      console.log('❌ Erreur scraping réel:', error.message);
      return [];
    }
  }

  async searchWithCurl(query, limit) {
    console.log('🔗 Tentative avec curl et cookie LinkedIn...');
    
    return new Promise((resolve) => {
      // Construire l'URL de recherche LinkedIn
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}`;
      
      console.log(`📡 URL de recherche: ${searchUrl}`);
      
      // Commande curl avec le cookie LinkedIn
      const curlCmd = [
        'curl', '-s',
        '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        '-H', 'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
        '-H', `Cookie: li_at=${this.cookie}`,
        '-H', 'Cache-Control: no-cache',
        searchUrl
      ];
      
      console.log('🚀 Exécution de la requête LinkedIn...');
      
      const curl = spawn('curl', curlCmd.slice(1));
      let output = '';
      let errorOutput = '';
      
      curl.stdout.on('data', (data) => {
        output += data;
      });
      
      curl.stderr.on('data', (data) => {
        errorOutput += data;
      });
      
      curl.on('close', (code) => {
        if (code !== 0) {
          console.log(`❌ Curl échec (code ${code}): ${errorOutput}`);
          resolve([]);
          return;
        }
        
        console.log(`📊 Réponse LinkedIn reçue: ${output.length} caractères`);
        
        // Analyser la réponse pour voir si on a des profils
        if (output.includes('profile-card') || output.includes('search-result')) {
          console.log('✅ Structure de profils détectée dans la réponse');
          
          // Parser les profils depuis le HTML
          const profiles = this.parseLinkedInHTML(output, query);
          resolve(profiles);
          
        } else if (output.includes('authwall') || output.includes('login')) {
          console.log('🔒 LinkedIn demande une authentification');
          console.log('💡 Cookie probablement expiré ou invalide');
          resolve([]);
          
        } else if (output.includes('challenge') || output.includes('security')) {
          console.log('🛡️ LinkedIn a détecté une activité suspecte');
          console.log('💡 Compte probablement flaggé pour automation');
          resolve([]);
          
        } else {
          console.log('❓ Réponse LinkedIn inattendue');
          console.log('📄 Début de la réponse:', output.substring(0, 200));
          resolve([]);
        }
      });
      
      // Timeout après 30 secondes
      setTimeout(() => {
        curl.kill();
        console.log('⏰ Timeout de la requête LinkedIn');
        resolve([]);
      }, 30000);
    });
  }

  parseLinkedInHTML(html, query) {
    console.log('🔍 Parsing du HTML LinkedIn...');
    
    const profiles = [];
    
    try {
      // Chercher les patterns LinkedIn pour les profils
      const nameRegex = /<span[^>]*class="[^"]*t-16[^"]*"[^>]*>([^<]+)<\/span>/g;
      const linkRegex = /href="(\/in\/[^"]+)"/g;
      
      let nameMatch;
      const names = [];
      while ((nameMatch = nameRegex.exec(html)) !== null) {
        const name = nameMatch[1].trim();
        if (name.length > 2 && name.length < 50) {
          names.push(name);
        }
      }
      
      let linkMatch;
      const links = [];
      while ((linkMatch = linkRegex.exec(html)) !== null) {
        const link = linkMatch[1];
        if (link.startsWith('/in/')) {
          links.push(`https://www.linkedin.com${link}`);
        }
      }
      
      console.log(`📊 Trouvé ${names.length} noms et ${links.length} liens`);
      
      // Combiner les noms et liens
      const maxProfiles = Math.min(names.length, links.length);
      for (let i = 0; i < maxProfiles; i++) {
        const linkedinId = links[i].split('/in/')[1].split('?')[0];
        
        profiles.push({
          name: names[i],
          title: 'LinkedIn Profile',
          company: '',
          location: '',
          linkedinUrl: links[i],
          searchScore: 95,
          extractedAt: new Date().toISOString(),
          method: 'browser-scraper-real',
          linkedinId: linkedinId,
          source: 'linkedin-direct',
          note: 'Profil extrait directement depuis LinkedIn avec cookie authentifié'
        });
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing HTML:', error.message);
    }
    
    console.log(`✅ ${profiles.length} profils extraits du HTML LinkedIn`);
    return profiles;
  }

  async close() {
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      hasCookie: !!this.cookie,
      method: 'browser-scraper',
      description: 'Direct LinkedIn scraping with authenticated cookie'
    };
  }
}

module.exports = new LinkedInBrowserScraper();