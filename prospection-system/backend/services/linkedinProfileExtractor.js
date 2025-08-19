/**
 * Service d'extraction de profils LinkedIn détaillés
 * Analyse les profils pour une personnalisation d'emails avancée
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Configuration Puppeteer avec Stealth
puppeteer.use(StealthPlugin());

class LinkedInProfileExtractor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔍 Initialisation de l\'extracteur de profils LinkedIn...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Configuration de la page
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await this.page.setViewport({ width: 1366, height: 768 });
      
      // Définir le cookie LinkedIn si disponible
      if (process.env.LINKEDIN_COOKIE) {
        await this.page.setCookie({
          name: 'li_at',
          value: process.env.LINKEDIN_COOKIE,
          domain: '.linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true
        });
        console.log('🔐 Cookie LinkedIn configuré pour l\'extraction');
      }

      this.isInitialized = true;
      console.log('✅ Extracteur de profils LinkedIn initialisé');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur initialisation extracteur:', error.message);
      return false;
    }
  }

  async extractDetailedProfile(linkedinUrl) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔎 Extraction du profil: ${linkedinUrl}`);
      
      // Naviguer vers le profil
      await this.page.goto(linkedinUrl, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Attendre que le contenu se charge
      await this.page.waitForTimeout(3000);

      // Extraire les informations détaillées
      const profileData = await this.page.evaluate(() => {
        const profile = {
          name: '',
          headline: '',
          location: '',
          connectionLevel: '',
          about: '',
          experience: [],
          education: [],
          skills: [],
          languages: [],
          certifications: [],
          volunteering: [],
          recommendations: 0,
          connections: '',
          profileImageUrl: '',
          backgroundImageUrl: ''
        };

        try {
          // Nom
          const nameElement = document.querySelector('h1.text-heading-xlarge, .pv-text-details__left-panel h1');
          if (nameElement) profile.name = nameElement.textContent.trim();

          // Headline (titre professionnel)
          const headlineElement = document.querySelector('.text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium');
          if (headlineElement) profile.headline = headlineElement.textContent.trim();

          // Localisation
          const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words, .pv-text-details__left-panel .pb2 .t-black--light');
          if (locationElement) profile.location = locationElement.textContent.trim();

          // À propos
          const aboutSection = document.querySelector('#about + * .pv-shared-text-with-see-more, .pv-about-section .pv-about__summary-text');
          if (aboutSection) {
            profile.about = aboutSection.textContent.trim().substring(0, 1000); // Limiter à 1000 chars
          }

          // Expérience professionnelle
          const experienceItems = document.querySelectorAll('#experience + * .pvs-list__paged-list-item, .pv-profile-section__content .pv-entity__summary-info');
          experienceItems.forEach((item, index) => {
            if (index < 3) { // Limiter aux 3 dernières expériences
              const titleElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__summary-info h3');
              const companyElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__secondary-title');
              const durationElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__bullet-item-v2');
              const descriptionElement = item.querySelector('.pv-shared-text-with-see-more span[aria-hidden="true"], .pv-entity__description');

              if (titleElement && companyElement) {
                profile.experience.push({
                  title: titleElement.textContent.trim(),
                  company: companyElement.textContent.trim(),
                  duration: durationElement ? durationElement.textContent.trim() : '',
                  description: descriptionElement ? descriptionElement.textContent.trim().substring(0, 300) : ''
                });
              }
            }
          });

          // Formation
          const educationItems = document.querySelectorAll('#education + * .pvs-list__paged-list-item, .pv-profile-section.education .pv-entity__summary-info');
          educationItems.forEach((item, index) => {
            if (index < 2) { // Limiter aux 2 dernières formations
              const schoolElement = item.querySelector('.mr1.t-bold span[aria-hidden="true"], .pv-entity__school-name');
              const degreeElement = item.querySelector('.t-14.t-normal span[aria-hidden="true"], .pv-entity__degree-name');
              const yearElement = item.querySelector('.t-14.t-normal.t-black--light span[aria-hidden="true"], .pv-entity__dates');

              if (schoolElement) {
                profile.education.push({
                  school: schoolElement.textContent.trim(),
                  degree: degreeElement ? degreeElement.textContent.trim() : '',
                  year: yearElement ? yearElement.textContent.trim() : ''
                });
              }
            }
          });

          // Compétences (si visibles)
          const skillsSection = document.querySelectorAll('#skills + * .pvs-list__paged-list-item span[aria-hidden="true"], .pv-skill-category-entity__name');
          skillsSection.forEach((skill, index) => {
            if (index < 10) { // Limiter à 10 compétences
              profile.skills.push(skill.textContent.trim());
            }
          });

          // Langues
          const languagesSection = document.querySelectorAll('#languages + * .pvs-list__paged-list-item span[aria-hidden="true"]');
          languagesSection.forEach((language, index) => {
            if (index < 5) {
              profile.languages.push(language.textContent.trim());
            }
          });

          // Nombre de connexions (si visible)
          const connectionsElement = document.querySelector('.t-black--light.t-normal a span');
          if (connectionsElement && connectionsElement.textContent.includes('connection')) {
            profile.connections = connectionsElement.textContent.trim();
          }

          // Photo de profil
          const profileImageElement = document.querySelector('.pv-top-card-profile-picture__image, .presence-entity__image');
          if (profileImageElement) {
            profile.profileImageUrl = profileImageElement.src || '';
          }

        } catch (error) {
          console.error('Erreur extraction DOM:', error);
        }

        return profile;
      });

      console.log(`✅ Profil extrait: ${profileData.name} - ${profileData.experience.length} expériences`);
      
      // Analyser le profil pour insights
      const insights = this.analyzeProfileForInsights(profileData);
      
      return {
        success: true,
        profile: profileData,
        insights: insights,
        extractedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Erreur extraction profil ${linkedinUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
        profile: null,
        insights: null
      };
    }
  }

  analyzeProfileForInsights(profile) {
    const insights = {
      seniority: 'mid-level',
      industry: 'unknown',
      careerTrajectory: 'stable',
      painPoints: [],
      interests: [],
      personalizedHooks: [],
      emailTone: 'professional'
    };

    try {
      // Analyser le niveau de séniorité
      const titles = profile.experience.map(exp => exp.title.toLowerCase()).join(' ');
      const headline = profile.headline.toLowerCase();
      
      if (titles.includes('chief') || titles.includes('ceo') || titles.includes('president') || 
          titles.includes('founder') || headline.includes('chief') || headline.includes('ceo')) {
        insights.seniority = 'executive';
        insights.emailTone = 'concise-executive';
      } else if (titles.includes('director') || titles.includes('head of') || titles.includes('vp') ||
                titles.includes('manager') && profile.experience.length >= 2) {
        insights.seniority = 'senior';
        insights.emailTone = 'professional-senior';
      } else if (titles.includes('junior') || profile.experience.length <= 1) {
        insights.seniority = 'junior';
        insights.emailTone = 'friendly-informative';
      }

      // Détecter l'industrie
      const fullText = (profile.headline + ' ' + profile.experience.map(e => e.company + ' ' + e.title).join(' ')).toLowerCase();
      
      if (fullText.includes('tech') || fullText.includes('software') || fullText.includes('digital')) {
        insights.industry = 'technology';
      } else if (fullText.includes('finance') || fullText.includes('bank') || fullText.includes('investment')) {
        insights.industry = 'finance';
      } else if (fullText.includes('healthcare') || fullText.includes('medical') || fullText.includes('pharma')) {
        insights.industry = 'healthcare';
      } else if (fullText.includes('consulting') || fullText.includes('advisory')) {
        insights.industry = 'consulting';
      }

      // Analyser la trajectoire de carrière
      if (profile.experience.length >= 3) {
        const companies = profile.experience.slice(0, 3).map(e => e.company);
        const uniqueCompanies = [...new Set(companies)];
        
        if (uniqueCompanies.length === 1) {
          insights.careerTrajectory = 'loyal'; // Même entreprise
        } else if (uniqueCompanies.length === companies.length) {
          insights.careerTrajectory = 'dynamic'; // Change souvent
        }
      }

      // Pain points basés sur le rôle
      if (headline.includes('hr') || headline.includes('human resources') || headline.includes('people')) {
        insights.painPoints = [
          'talent acquisition challenges',
          'employee retention',
          'HR process optimization',
          'compliance and regulations'
        ];
      } else if (headline.includes('sales') || headline.includes('business development')) {
        insights.painPoints = [
          'lead generation',
          'sales process efficiency',
          'CRM optimization',
          'customer acquisition cost'
        ];
      } else if (headline.includes('marketing')) {
        insights.painPoints = [
          'lead quality',
          'marketing attribution',
          'content performance',
          'ROI measurement'
        ];
      }

      // Hooks personnalisés basés sur l'expérience
      if (profile.experience.length > 0) {
        const currentRole = profile.experience[0];
        insights.personalizedHooks.push(
          `your experience at ${currentRole.company}`,
          `your role as ${currentRole.title}`,
          `your ${insights.industry} background`
        );
      }

      // Éducation prestigieuse ?
      const prestigiousSchools = ['harvard', 'stanford', 'mit', 'wharton', 'insead', 'hec', 'polytechnique'];
      if (profile.education.some(edu => 
        prestigiousSchools.some(school => edu.school.toLowerCase().includes(school))
      )) {
        insights.personalizedHooks.push('your prestigious educational background');
      }

    } catch (error) {
      console.error('Erreur analyse insights:', error);
    }

    return insights;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.isInitialized = false;
  }
}

module.exports = new LinkedInProfileExtractor();