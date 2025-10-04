/**
 * 🎯 Prospect Entity - Domain Core
 * Entité centrale du domaine métier Graixl
 */

class Prospect {
  constructor({
    id,
    name,
    title,
    company,
    industry,
    email = null,
    linkedinProfile = null,
    contactInfo = null,
    prospectionMetadata = null
  }) {
    this.id = id
    this.name = name
    this.title = title
    this.company = company
    this.industry = industry
    this.email = email
    this.linkedinProfile = linkedinProfile
    this.contactInfo = contactInfo || new ContactInfo()
    this.prospectionMetadata = prospectionMetadata || new ProspectionMetadata()
    
    this.createdAt = new Date()
    this.updatedAt = new Date()
    this.version = 1
  }

  // 🎯 Business Logic - Score Graixl
  calculateGraixlScore() {
    let score = 0
    
    // Score sur les informations de base (30%)
    if (this.hasCompleteProfile()) score += 30
    if (this.isInTargetIndustry()) score += 20
    if (this.hasSeniorPosition()) score += 25
    
    // Score sur l'enrichissement (40%)
    if (this.hasValidEmail()) score += 25
    if (this.hasLinkedInProfile()) score += 15
    
    // Score sur les métadonnées de prospection (30%)
    score += this.prospectionMetadata.getEngagementScore()
    
    return Math.min(100, Math.max(0, score))
  }

  // 🔍 Validation Methods
  hasCompleteProfile() {
    return this.name && this.title && this.company && this.industry
  }

  hasValidEmail() {
    return this.email && this.contactInfo.isEmailVerified()
  }

  hasLinkedInProfile() {
    return this.linkedinProfile && this.linkedinProfile.isValid()
  }

  isInTargetIndustry() {
    const targetIndustries = ['technology', 'banking', 'ecommerce', 'gaming', 'consulting']
    return targetIndustries.includes(this.industry.toLowerCase())
  }

  hasSeniorPosition() {
    const seniorKeywords = ['head', 'director', 'manager', 'chief', 'vp', 'vice president', 'lead']
    return seniorKeywords.some(keyword => this.title.toLowerCase().includes(keyword))
  }

  // 📧 Email Generation Support
  getPersonalizationData() {
    return {
      name: this.name,
      firstName: this.name.split(' ')[0],
      title: this.title,
      company: this.company,
      industry: this.industry,
      graixlScore: this.calculateGraixlScore(),
      seniorLevel: this.hasSeniorPosition(),
      hasLinkedIn: this.hasLinkedInProfile()
    }
  }

  // 🔄 Update Methods
  enrichWithEmail(email, verified = false) {
    this.email = email
    this.contactInfo.setEmailVerification(verified)
    this.prospectionMetadata.addEnrichmentStep('email', { email, verified })
    this.updatedAt = new Date()
    this.version++
  }

  enrichWithLinkedIn(linkedinProfile) {
    this.linkedinProfile = linkedinProfile
    this.prospectionMetadata.addEnrichmentStep('linkedin', linkedinProfile)
    this.updatedAt = new Date()
    this.version++
  }

  updateProspectionStatus(status, agentId, metadata = {}) {
    this.prospectionMetadata.updateStatus(status, agentId, metadata)
    this.updatedAt = new Date()
    this.version++
  }

  // 🏷️ Tagging System
  addTag(tag, source = 'manual') {
    this.prospectionMetadata.addTag(tag, source)
    this.updatedAt = new Date()
  }

  removeTag(tag) {
    this.prospectionMetadata.removeTag(tag)
    this.updatedAt = new Date()
  }

  hasTag(tag) {
    return this.prospectionMetadata.hasTag(tag)
  }

  // 📊 Analytics Support
  getAnalyticsData() {
    return {
      id: this.id,
      industry: this.industry,
      title: this.title,
      company: this.company,
      graixlScore: this.calculateGraixlScore(),
      hasEmail: !!this.email,
      hasLinkedIn: this.hasLinkedInProfile(),
      createdAt: this.createdAt,
      prospectionSteps: this.prospectionMetadata.getStepsCount(),
      tags: this.prospectionMetadata.getTags()
    }
  }

  // 🔄 Domain Events
  getUncommittedEvents() {
    return this.prospectionMetadata.getDomainEvents()
  }

  markEventsAsCommitted() {
    this.prospectionMetadata.clearDomainEvents()
  }

  // 🚀 Export/Serialization
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      company: this.company,
      industry: this.industry,
      email: this.email,
      linkedinProfile: this.linkedinProfile?.toJSON(),
      contactInfo: this.contactInfo.toJSON(),
      prospectionMetadata: this.prospectionMetadata.toJSON(),
      graixlScore: this.calculateGraixlScore(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version
    }
  }

  static fromJSON(data) {
    const prospect = new Prospect({
      id: data.id,
      name: data.name,
      title: data.title,
      company: data.company,
      industry: data.industry,
      email: data.email,
      linkedinProfile: data.linkedinProfile ? LinkedInProfile.fromJSON(data.linkedinProfile) : null,
      contactInfo: ContactInfo.fromJSON(data.contactInfo),
      prospectionMetadata: ProspectionMetadata.fromJSON(data.prospectionMetadata)
    })
    
    prospect.createdAt = new Date(data.createdAt)
    prospect.updatedAt = new Date(data.updatedAt)
    prospect.version = data.version
    
    return prospect
  }
}

// 📞 Value Object - Contact Info
class ContactInfo {
  constructor({
    email = null,
    emailVerified = false,
    phone = null,
    phoneVerified = false,
    socialProfiles = []
  } = {}) {
    this.email = email
    this.emailVerified = emailVerified
    this.phone = phone
    this.phoneVerified = phoneVerified
    this.socialProfiles = socialProfiles
  }

  isEmailVerified() {
    return this.emailVerified
  }

  setEmailVerification(verified) {
    this.emailVerified = verified
  }

  addSocialProfile(platform, url) {
    this.socialProfiles.push({ platform, url, addedAt: new Date() })
  }

  toJSON() {
    return {
      email: this.email,
      emailVerified: this.emailVerified,
      phone: this.phone,
      phoneVerified: this.phoneVerified,
      socialProfiles: this.socialProfiles
    }
  }

  static fromJSON(data) {
    return new ContactInfo(data)
  }
}

// 📊 Value Object - Prospection Metadata
class ProspectionMetadata {
  constructor({
    status = 'new',
    tags = [],
    enrichmentSteps = [],
    prospectionHistory = [],
    domainEvents = []
  } = {}) {
    this.status = status
    this.tags = new Set(tags)
    this.enrichmentSteps = enrichmentSteps
    this.prospectionHistory = prospectionHistory
    this.domainEvents = domainEvents
  }

  updateStatus(newStatus, agentId, metadata = {}) {
    this.prospectionHistory.push({
      previousStatus: this.status,
      newStatus,
      agentId,
      metadata,
      timestamp: new Date()
    })
    
    this.status = newStatus
    
    // Domain Event
    this.addDomainEvent('ProspectStatusChanged', {
      prospectId: this.id,
      oldStatus: this.status,
      newStatus,
      agentId,
      timestamp: new Date()
    })
  }

  addEnrichmentStep(type, data) {
    this.enrichmentSteps.push({
      type,
      data,
      timestamp: new Date()
    })
    
    this.addDomainEvent('ProspectEnriched', {
      prospectId: this.id,
      enrichmentType: type,
      timestamp: new Date()
    })
  }

  addTag(tag, source = 'manual') {
    this.tags.add(tag)
    
    this.addDomainEvent('ProspectTagged', {
      prospectId: this.id,
      tag,
      source,
      timestamp: new Date()
    })
  }

  removeTag(tag) {
    this.tags.delete(tag)
  }

  hasTag(tag) {
    return this.tags.has(tag)
  }

  getTags() {
    return Array.from(this.tags)
  }

  getStepsCount() {
    return this.enrichmentSteps.length
  }

  getEngagementScore() {
    // Score basé sur les étapes d'enrichissement et l'historique
    let score = 0
    score += this.enrichmentSteps.length * 5 // 5 points par étape
    score += this.prospectionHistory.length * 2 // 2 points par interaction
    return Math.min(30, score) // Max 30 points pour engagement
  }

  addDomainEvent(eventType, data) {
    this.domainEvents.push({
      id: crypto.randomUUID(),
      type: eventType,
      data,
      timestamp: new Date()
    })
  }

  getDomainEvents() {
    return [...this.domainEvents]
  }

  clearDomainEvents() {
    this.domainEvents = []
  }

  toJSON() {
    return {
      status: this.status,
      tags: Array.from(this.tags),
      enrichmentSteps: this.enrichmentSteps,
      prospectionHistory: this.prospectionHistory,
      domainEvents: this.domainEvents
    }
  }

  static fromJSON(data) {
    return new ProspectionMetadata({
      status: data.status,
      tags: data.tags || [],
      enrichmentSteps: data.enrichmentSteps || [],
      prospectionHistory: data.prospectionHistory || [],
      domainEvents: data.domainEvents || []
    })
  }
}

// 💼 Value Object - LinkedIn Profile
class LinkedInProfile {
  constructor({
    url,
    profileId,
    summary = null,
    experience = [],
    education = [],
    skills = [],
    connections = 0,
    isValid = true
  }) {
    this.url = url
    this.profileId = profileId
    this.summary = summary
    this.experience = experience
    this.education = education
    this.skills = skills
    this.connections = connections
    this.isValid = isValid
    this.scrapedAt = new Date()
  }

  isSeniorProfile() {
    return this.experience.some(exp => 
      exp.title && ['head', 'director', 'manager', 'chief', 'vp'].some(keyword =>
        exp.title.toLowerCase().includes(keyword)
      )
    )
  }

  getRelevantSkills(targetSkills = []) {
    return this.skills.filter(skill => 
      targetSkills.some(target => 
        skill.toLowerCase().includes(target.toLowerCase())
      )
    )
  }

  toJSON() {
    return {
      url: this.url,
      profileId: this.profileId,
      summary: this.summary,
      experience: this.experience,
      education: this.education,
      skills: this.skills,
      connections: this.connections,
      isValid: this.isValid,
      scrapedAt: this.scrapedAt
    }
  }

  static fromJSON(data) {
    const profile = new LinkedInProfile(data)
    profile.scrapedAt = new Date(data.scrapedAt)
    return profile
  }
}

module.exports = {
  Prospect,
  ContactInfo,
  ProspectionMetadata,
  LinkedInProfile
}