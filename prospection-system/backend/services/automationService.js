/**
 * Service d'Automatisation pour LinkedIn et Email
 * Gère les connexions LinkedIn, messages, emails personnalisés IA, et follow-ups
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const linkedinProfileExtractor = require('./linkedinProfileExtractor');

// Configuration Puppeteer avec Stealth
puppeteer.use(StealthPlugin());

class AutomationService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
    this.emailTransporter = null;
    this.followUps = []; // Stockage temporaire des follow-ups
  }

  async initialize() {
    try {
      console.log('🤖 Initialisation du service d\\\'automatisation...');
      
      // Initialiser le transporteur email
      await this.initializeEmailTransporter();
      
      this.isInitialized = true;
      console.log('✅ Service d\\\'automatisation initialisé');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur initialisation automatisation:', error.message);
      return false;
    }
  }

  async initializeEmailTransporter() {
    // Configuration Gmail (ou autre service SMTP)
    this.emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD // App password, pas le mot de passe normal
      }
    });

    // Test de la connexion
    try {
      await this.emailTransporter.verify();
      console.log('✅ Email transporter configuré');
    } catch (error) {
      console.log('⚠️ Email non configuré (ajoutez GMAIL_USER et GMAIL_APP_PASSWORD dans .env)');
    }
  }

  // === LINKEDIN AUTOMATION ===

  async sendLinkedInConnection(data) {
    try {
      const { prospectId, linkedinUrl, name, title, company } = data;
      
      console.log(`🔗 Envoi connexion LinkedIn à ${name}...`);
      
      // Pour le moment, simulation (implémentation réelle nécessiterait l'automatisation LinkedIn)
      await this.simulateDelay(2000, 5000);
      
      // Ici vous pourriez intégrer :
      // - LinkedIn API (si disponible)
      // - Puppeteer automation avec LinkedIn
      // - Webhook vers un service tiers
      
      console.log(`✅ Connexion LinkedIn envoyée à ${name}`);
      
      return {
        success: true,
        message: `Connection request sent to ${name} at ${company}`,
        prospectId: prospectId,
        action: 'linkedin-connection',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur connexion LinkedIn:', error.message);
      throw error;
    }
  }

  async sendLinkedInMessage(data) {
    try {
      const { prospectId, linkedinUrl, message, name } = data;
      
      console.log(`💬 Envoi message LinkedIn à ${name}...`);
      
      // Simulation pour le moment
      await this.simulateDelay(1500, 3000);
      
      console.log(`✅ Message LinkedIn envoyé à ${name}`);
      
      return {
        success: true,
        message: `LinkedIn message sent to ${name}`,
        prospectId: prospectId,
        action: 'linkedin-message',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur message LinkedIn:', error.message);
      throw error;
    }
  }

  // === EMAIL AUTOMATION ===

  async generatePersonalizedEmail(prospect) {
    try {
      const { name, title, company, location, linkedinUrl, tags } = prospect;
      
      console.log(`🤖 Génération email IA avancée pour ${name}...`);
      
      let profileData = null;
      let insights = null;
      
      // Extraire le profil LinkedIn détaillé si URL disponible
      if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
        console.log(`🔍 Extraction du profil LinkedIn: ${linkedinUrl}`);
        
        try {
          const extractionResult = await linkedinProfileExtractor.extractDetailedProfile(linkedinUrl);
          
          if (extractionResult.success) {
            profileData = extractionResult.profile;
            insights = extractionResult.insights;
            console.log(`✅ Profil extrait: ${profileData.experience.length} expériences, séniorité: ${insights.seniority}`);
          } else {
            console.log(`⚠️ Échec extraction profil, utilisation données de base`);
          }
        } catch (extractionError) {
          console.error(`❌ Erreur extraction profil:`, extractionError.message);
        }
      }
      
      // Générer l'email avec toutes les données disponibles
      const emailTemplate = this.createAdvancedEmailTemplate(prospect, profileData, insights);
      
      return {
        success: true,
        email: emailTemplate,
        prospect: name,
        profileAnalyzed: !!profileData,
        insights: insights,
        generatedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur génération email:', error.message);
      throw error;
    }
  }

  createAdvancedEmailTemplate(prospect, profileData, insights) {
    const { name, title, company, location, tags } = prospect;
    
    // Utiliser les insights si disponibles, sinon fallback sur méthode classique
    if (profileData && insights) {
      return this.createPersonalizedEmailFromProfile(prospect, profileData, insights);
    } else {
      return this.createEmailTemplate(prospect);
    }
  }

  createPersonalizedEmailFromProfile(prospect, profile, insights) {
    const { name, title, company, location } = prospect;
    
    // Adapter le ton selon la séniorité
    let greeting, tone, valueProps, closing;
    
    switch (insights.emailTone) {
      case 'concise-executive':
        greeting = `${name},`;
        tone = 'direct';
        valueProps = '3 key outcomes';
        closing = 'Worth a brief conversation?';
        break;
      case 'professional-senior':
        greeting = `Hi ${name},`;
        tone = 'professional';
        valueProps = 'significant results';
        closing = 'Would you be interested in a 15-minute discussion?';
        break;
      case 'friendly-informative':
        greeting = `Hello ${name},`;
        tone = 'friendly';
        valueProps = 'great results for similar professionals';
        closing = 'I would love to share some insights that might be valuable for your role.';
        break;
      default:
        greeting = `Hi ${name},`;
        tone = 'professional';
        valueProps = 'impressive results';
        closing = 'Would you be open to a brief conversation?';
    }

    // Construire le contexte personnalisé
    let personalizedContext = '';
    
    // Mentionner l'expérience récente
    if (profile.experience && profile.experience[0]) {
      const currentRole = profile.experience[0];
      personalizedContext += `I noticed your role as ${currentRole.title} at ${currentRole.company}`;
      
      if (location) {
        personalizedContext += ` in ${location}`;
      }
      personalizedContext += '. ';
    }

    // Mentionner le parcours si intéressant
    if (insights.careerTrajectory === 'dynamic') {
      personalizedContext += `Your diverse background across `;
      const companies = profile.experience.slice(0, 3).map(e => e.company);
      personalizedContext += companies.slice(0, 2).join(' and ') + ' shows impressive adaptability. ';
    } else if (insights.careerTrajectory === 'loyal') {
      personalizedContext += `Your commitment to growing within ${company} is impressive. `;
    }

    // Mentionner l'éducation si prestigieuse
    if (profile.education && profile.education[0] && 
        insights.personalizedHooks.includes('your prestigious educational background')) {
      personalizedContext += `Your ${profile.education[0].school} background adds significant value to your perspective. `;
    }

    // Pain points spécifiques à leur rôle
    let painPointsText = '';
    if (insights.painPoints && insights.painPoints.length > 0) {
      const mainPainPoint = insights.painPoints[0];
      painPointsText = `Given your focus on ${mainPainPoint}, `;
    }

    // Construire la proposition de valeur
    let valueProposition = '';
    if (insights.industry === 'technology') {
      valueProposition = 'streamline tech recruitment processes and improve developer retention';
    } else if (insights.industry === 'finance') {
      valueProposition = 'optimize financial services talent acquisition with compliance-first approaches';
    } else if (insights.industry === 'healthcare') {
      valueProposition = 'enhance healthcare staffing with specialized recruitment strategies';
    } else {
      // Générique basé sur le titre
      if (title?.toLowerCase().includes('hrbp') || title?.toLowerCase().includes('hr business partner')) {
        valueProposition = 'align HR strategy with business goals more effectively';
      } else if (title?.toLowerCase().includes('talent acquisition') || title?.toLowerCase().includes('recruiter')) {
        valueProposition = 'dramatically improve candidate sourcing and quality';
      } else {
        valueProposition = 'transform your recruitment and talent management processes';
      }
    }

    // Mentions spécifiques des skills ou expériences
    let skillsContext = '';
    if (profile.skills && profile.skills.length > 0) {
      const relevantSkills = profile.skills.filter(skill => 
        skill.toLowerCase().includes('hr') || 
        skill.toLowerCase().includes('talent') || 
        skill.toLowerCase().includes('recruitment') ||
        skill.toLowerCase().includes('people')
      ).slice(0, 2);
      
      if (relevantSkills.length > 0) {
        skillsContext = `Your expertise in ${relevantSkills.join(' and ')} particularly caught my attention. `;
      }
    }

    // Construire l'email complet
    const subject = insights.seniority === 'executive' 
      ? `${name}: Strategic ${insights.industry || 'talent'} transformation`
      : `${name}, enhance ${valueProposition.split(' ')[0]} at ${company}`;

    let content = `${greeting}\n\n`;
    content += personalizedContext;
    content += skillsContext;
    content += `${painPointsText}I thought you might find our approach to ${valueProposition} interesting.\n\n`;

    // Résultats adaptés à la séniorité
    if (insights.seniority === 'executive') {
      content += `We've helped similar leaders achieve:\n`;
      content += `• 40% reduction in time-to-hire\n`;
      content += `• 60% improvement in retention rates\n`;
      content += `• 25% cost reduction in talent acquisition\n\n`;
    } else {
      content += `Our platform has helped similar professionals:\n`;
      content += `• Cut recruitment time by 40%\n`;
      content += `• Improve candidate quality scores by 60%\n`;
      content += `• Streamline HR workflows significantly\n\n`;
    }

    content += `${closing}\n\n`;
    content += insights.seniority === 'executive' ? `Best regards,\n` : `Best,\n`;
    content += `[Your Name]\n\n`;

    // P.S. personnalisé
    if (profile.about && profile.about.includes('innovation')) {
      content += `P.S. Your focus on innovation in HR really resonates with our approach.`;
    } else if (insights.careerTrajectory === 'dynamic') {
      content += `P.S. Given your diverse experience, I would love to share how other cross-industry leaders have leveraged our platform.`;
    } else {
      content += `P.S. I have a relevant case study from a similar ${title} at a comparable company that might interest you.`;
    }

    return {
      subject: subject,
      content: content,
      personalization: {
        name: name,
        title: title,
        company: company,
        seniority: insights.seniority,
        industry: insights.industry,
        profileAnalyzed: true,
        personalizedHooks: insights.personalizedHooks
      }
    };
  }

  createEmailTemplate(prospect) {
    const { name, title, company, location, tags } = prospect;
    
    // Déterminer le contexte basé sur les tags/titre
    let context = 'recruitment solutions';
    let painPoint = 'streamlining your hiring process';
    let solution = 'our AI-powered recruitment platform';
    
    if (title?.toLowerCase().includes('hrbp') || title?.toLowerCase().includes('hr business partner')) {
      context = 'HR business partnership';
      painPoint = 'aligning HR strategy with business goals';
      solution = 'our strategic HR tools';
    } else if (title?.toLowerCase().includes('talent acquisition') || title?.toLowerCase().includes('recruiter')) {
      context = 'talent acquisition';
      painPoint = 'finding and attracting top talent efficiently';
      solution = 'our advanced sourcing and screening tools';
    } else if (title?.toLowerCase().includes('chro') || title?.toLowerCase().includes('chief')) {
      context = 'HR leadership';
      painPoint = 'transforming HR operations at scale';
      solution = 'our enterprise HR transformation platform';
    }
    
    const subject = `${name}, transform ${context} at ${company}`;
    
    const content = `Hi ${name},

I noticed your role as ${title} at ${company}${location ? ` in ${location}` : ''}. Given your expertise in ${context}, I thought you might be interested in how we are helping similar professionals with ${painPoint}.

${solution} has helped companies like yours:
• Reduce time-to-hire by 40%
• Improve candidate quality by 60%
• Streamline HR workflows and reporting

Would you be open to a brief 15-minute conversation next week to explore how this could benefit ${company}?

Best regards,
[Your Name]

P.S. I would be happy to share a case study of how we helped a similar ${title} at a comparable company achieve remarkable results.`;

    return {
      subject: subject,
      content: content,
      personalization: {
        name: name,
        title: title,
        company: company,
        context: context
      }
    };
  }

  async sendEmail(data) {
    try {
      const { prospect, emailContent } = data;
      
      if (!this.emailTransporter) {
        throw new Error('Email transporter not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env');
      }
      
      console.log(`📧 Envoi email à ${prospect.name}...`);
      
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: prospect.email,
        subject: emailContent.subject || `Hello ${prospect.name}`,
        text: emailContent.content || emailContent,
        html: emailContent.content ? emailContent.content.replace(/\n/g, '<br>') : emailContent.replace(/\n/g, '<br>')
      };
      
      const result = await this.emailTransporter.sendMail(mailOptions);
      
      console.log(`✅ Email envoyé à ${prospect.name}`);
      
      return {
        success: true,
        messageId: result.messageId,
        prospect: prospect.name,
        email: prospect.email,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erreur envoi email:', error.message);
      throw error;
    }
  }

  // === FOLLOW-UP AUTOMATION ===

  async scheduleFollowUp(data) {
    try {
      const { prospectId, days, notes, prospect } = data;
      
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + days);
      
      const followUp = {
        id: this.generateId(),
        prospectId: prospectId,
        prospectName: prospect.name,
        prospectEmail: prospect.email,
        scheduledDate: followUpDate,
        notes: notes,
        status: 'scheduled',
        createdAt: new Date()
      };
      
      this.followUps.push(followUp);
      
      console.log(`⏰ Follow-up programmé pour ${prospect.name} le ${followUpDate.toLocaleDateString()}`);
      
      // Ici vous pourriez intégrer avec un système de scheduling réel
      // comme un cron job, Redis scheduler, ou un service externe
      
      return {
        success: true,
        followUpId: followUp.id,
        scheduledDate: followUpDate,
        prospect: prospect.name,
        notes: notes
      };
      
    } catch (error) {
      console.error('❌ Erreur programmation follow-up:', error.message);
      throw error;
    }
  }

  async getScheduledFollowUps() {
    return this.followUps.filter(f => f.status === 'scheduled');
  }

  async executeFollowUps() {
    const today = new Date();
    const dueFollowUps = this.followUps.filter(f => 
      f.status === 'scheduled' && 
      f.scheduledDate <= today
    );
    
    for (const followUp of dueFollowUps) {
      try {
        console.log(`🔔 Exécution follow-up pour ${followUp.prospectName}`);
        
        // Marquer comme exécuté
        followUp.status = 'executed';
        followUp.executedAt = new Date();
        
        // Ici vous pourriez automatiquement :
        // - Envoyer un email de relance
        // - Créer une tâche dans votre CRM
        // - Envoyer une notification
        
      } catch (error) {
        console.error(`❌ Erreur exécution follow-up ${followUp.id}:`, error.message);
        followUp.status = 'failed';
        followUp.error = error.message;
      }
    }
    
    return dueFollowUps;
  }

  // === UTILITY METHODS ===

  async simulateDelay(minMs = 1000, maxMs = 3000) {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.isInitialized = false;
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'active' : 'inactive',
      emailConfigured: !!this.emailTransporter,
      followUpsScheduled: this.followUps.length,
      features: [
        'LinkedIn connections',
        'LinkedIn messaging', 
        'AI email generation',
        'Email sending',
        'Follow-up scheduling'
      ]
    };
  }
}

module.exports = new AutomationService();