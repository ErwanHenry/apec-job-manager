/**
 * LinkedIn Fallback Service
 * 
 * Provides fallback mechanisms when LinkedIn scraping is not available,
 * including mock data for testing and alternative data sources.
 */

class LinkedInFallback {
  constructor() {
    this.isEnabled = process.env.ENABLE_LINKEDIN_FALLBACK !== 'false';
    this.mockData = this.generateMockProfiles();
  }

  generateMockProfiles() {
    const titles = [
      'Software Engineer', 'Senior Developer', 'CTO', 'VP Engineering',
      'Product Manager', 'Head of Sales', 'Marketing Director', 'CEO',
      'Data Scientist', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'Tech Lead', 'Engineering Manager', 'Startup Founder'
    ];

    const companies = [
      'TechCorp', 'InnovateStartup', 'DataSolutions', 'CloudTech', 'AI Dynamics',
      'SaaS Company', 'E-commerce Plus', 'FinTech Solutions', 'HealthTech',
      'EdTech Innovations', 'GreenTech', 'CyberSecurity Co', 'Blockchain Ltd',
      'IoT Systems', 'MobileTech', 'GameDev Studio'
    ];

    const locations = [
      'Paris, France', 'London, UK', 'Berlin, Germany', 'Amsterdam, Netherlands',
      'Barcelona, Spain', 'Milan, Italy', 'Stockholm, Sweden', 'Dublin, Ireland',
      'San Francisco, CA', 'New York, NY', 'Toronto, Canada', 'Sydney, Australia'
    ];

    const firstNames = [
      'Sophie', 'Thomas', 'Julie', 'Alexandre', 'Marie', 'Pierre', 'Emma', 'Lucas',
      'Sarah', 'Nicolas', 'Camille', 'Antoine', 'Laura', 'Maxime', 'Clara', 'Hugo',
      'Anna', 'David', 'Léa', 'Julien', 'Chloé', 'Romain', 'Manon', 'Florian'
    ];

    const lastNames = [
      'Durand', 'Lambert', 'Chen', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert',
      'Petit', 'Richard', 'Michel', 'Garcia', 'David', 'Bertrand', 'Moreau', 'Simon',
      'Laurent', 'Lefebvre', 'Leroy', 'Roux', 'Fournier', 'Girard', 'Bonnet', 'Dupont'
    ];

    const profiles = [];

    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      profiles.push({
        name: `${firstName} ${lastName}`,
        title,
        company,
        location,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
        searchScore: Math.floor(Math.random() * 30) + 70, // 70-100
        source: 'mock'
      });
    }

    return profiles;
  }

  async search(query, limit = 10) {
    console.log(`🎭 Using LinkedIn fallback for query: "${query}"`);
    
    // Simulate search delay
    await this.delay(2000, 4000);

    // Filter mock profiles based on query
    const filteredProfiles = this.filterProfiles(query);
    
    // Return requested number of results
    const results = filteredProfiles.slice(0, limit);
    
    console.log(`✅ Fallback returned ${results.length} mock profiles`);
    
    return results;
  }

  filterProfiles(query) {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 2);
    
    return this.mockData
      .map(profile => ({
        ...profile,
        relevanceScore: this.calculateRelevanceScore(profile, keywords)
      }))
      .filter(profile => profile.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(({ relevanceScore, ...profile }) => profile);
  }

  calculateRelevanceScore(profile, keywords) {
    let score = 0;
    const searchText = `${profile.title} ${profile.company} ${profile.location}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (searchText.includes(keyword)) {
        score += 10;
      }
      
      // Boost score for title matches
      if (profile.title.toLowerCase().includes(keyword)) {
        score += 20;
      }
      
      // Boost score for exact matches
      if (profile.title.toLowerCase() === keyword) {
        score += 50;
      }
    });
    
    return score;
  }

  async getProfileDetails(profileUrl) {
    console.log(`🎭 Using fallback for profile details: ${profileUrl}`);
    
    await this.delay(1000, 2000);
    
    // Extract name from URL for consistency
    const urlParts = profileUrl.split('/');
    const profileId = urlParts[urlParts.length - 1] || 'unknown';
    
    return {
      name: 'Mock Profile',
      headline: 'Software Engineer at TechCorp',
      location: 'Paris, France',
      about: 'Passionate about technology and innovation. Currently working on cutting-edge projects.',
      currentCompany: 'TechCorp',
      email: '',
      phone: '',
      source: 'mock'
    };
  }

  async delay(min, max) {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async healthCheck() {
    return {
      isEnabled: this.isEnabled,
      mockDataCount: this.mockData.length,
      status: 'active'
    };
  }

  // Alternative data sources could be added here
  async searchAlternativeSources(query, limit) {
    console.log(`🔍 Searching alternative sources for: "${query}"`);
    
    // Future: Integration with other professional networks or APIs
    // For now, return enhanced mock data
    
    const results = await this.search(query, limit);
    
    return results.map(profile => ({
      ...profile,
      source: 'alternative',
      confidence: Math.floor(Math.random() * 20) + 60 // 60-80% confidence
    }));
  }

  // Test different search scenarios
  async testSearchScenarios() {
    const scenarios = [
      { query: 'software engineer', expectedResults: 5 },
      { query: 'CTO startup', expectedResults: 3 },
      { query: 'product manager', expectedResults: 4 },
      { query: 'data scientist', expectedResults: 2 }
    ];

    const results = [];

    for (const scenario of scenarios) {
      try {
        const searchResults = await this.search(scenario.query, scenario.expectedResults);
        
        results.push({
          query: scenario.query,
          expectedCount: scenario.expectedResults,
          actualCount: searchResults.length,
          success: searchResults.length > 0,
          results: searchResults
        });
        
      } catch (error) {
        results.push({
          query: scenario.query,
          expectedCount: scenario.expectedResults,
          actualCount: 0,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new LinkedInFallback();