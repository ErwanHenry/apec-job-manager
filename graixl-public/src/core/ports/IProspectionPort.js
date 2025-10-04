/**
 * 🔌 IProspectionPort - Interface Port (Hexagonal Architecture)
 * Définit le contrat pour les opérations de prospection
 */

/**
 * Port principal pour les opérations de prospection
 * Interface between Domain and External World
 */
class IProspectionPort {
  /**
   * 🎯 Recherche de prospects avec critères avancés
   * @param {ProspectionCriteria} criteria - Critères de recherche
   * @param {ProspectionOptions} options - Options d'exécution
   * @returns {Promise<ProspectionResult>}
   */
  async searchProspects(criteria, options = {}) {
    throw new Error('searchProspects must be implemented')
  }

  /**
   * 📧 Enrichissement email de prospects
   * @param {Prospect[]} prospects - Liste de prospects à enrichir
   * @param {EmailEnrichmentOptions} options - Options d'enrichissement
   * @returns {Promise<EnrichmentResult>}
   */
  async enrichWithEmails(prospects, options = {}) {
    throw new Error('enrichWithEmails must be implemented')
  }

  /**
   * 🤖 Exécution workflow complet multi-agents
   * @param {WorkflowType} workflowType - Type de workflow
   * @param {any} data - Données d'entrée
   * @param {WorkflowOptions} options - Options du workflow
   * @returns {Promise<WorkflowResult>}
   */
  async executeIntelligentWorkflow(workflowType, data, options = {}) {
    throw new Error('executeIntelligentWorkflow must be implemented')
  }

  /**
   * ⚡ Recherche rapide avec swarm d'agents
   * @param {string} query - Requête de recherche
   * @param {SwarmOptions} options - Options du swarm
   * @returns {Promise<SwarmResult>}
   */
  async quickSwarmSearch(query, options = {}) {
    throw new Error('quickSwarmSearch must be implemented')
  }

  /**
   * 📊 Obtenir métriques de performance
   * @returns {Promise<PerformanceMetrics>}
   */
  async getPerformanceMetrics() {
    throw new Error('getPerformanceMetrics must be implemented')
  }

  /**
   * 🔍 Obtenir statut du système
   * @returns {Promise<SystemHealth>}
   */
  async getSystemHealth() {
    throw new Error('getSystemHealth must be implemented')
  }

  /**
   * 🧪 Lancer expérience créative
   * @param {ExperimentConfig} config - Configuration de l'expérience
   * @returns {Promise<ExperimentResult>}
   */
  async runCreativeExperiment(config) {
    throw new Error('runCreativeExperiment must be implemented')
  }
}

/**
 * Port pour la gestion des campagnes
 */
class ICampaignPort {
  /**
   * 📧 Créer et lancer campagne email
   * @param {CampaignConfig} config - Configuration de la campagne
   * @returns {Promise<Campaign>}
   */
  async createEmailCampaign(config) {
    throw new Error('createEmailCampaign must be implemented')
  }

  /**
   * 📈 Suivre performance de campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Promise<CampaignMetrics>}
   */
  async trackCampaignPerformance(campaignId) {
    throw new Error('trackCampaignPerformance must be implemented')
  }

  /**
   * ⏹️ Arrêter campagne
   * @param {string} campaignId - ID de la campagne
   * @returns {Promise<void>}
   */
  async stopCampaign(campaignId) {
    throw new Error('stopCampaign must be implemented')
  }

  /**
   * 🎯 Optimiser campagne avec IA
   * @param {string} campaignId - ID de la campagne
   * @param {OptimizationOptions} options - Options d'optimisation
   * @returns {Promise<OptimizationResult>}
   */
  async optimizeCampaignWithAI(campaignId, options) {
    throw new Error('optimizeCampaignWithAI must be implemented')
  }
}

/**
 * Port pour les agents intelligents
 */
class IAgentPort {
  /**
   * 🤖 Créer agent spécialisé
   * @param {AgentType} type - Type d'agent
   * @param {AgentConfig} config - Configuration
   * @returns {Promise<Agent>}
   */
  async createAgent(type, config) {
    throw new Error('createAgent must be implemented')
  }

  /**
   * 👥 Créer équipe d'agents
   * @param {TeamConfig} config - Configuration de l'équipe
   * @returns {Promise<AgentTeam>}
   */
  async createAgentTeam(config) {
    throw new Error('createAgentTeam must be implemented')
  }

  /**
   * 🎓 Établir relation mentor-étudiant
   * @param {string} mentorId - ID agent mentor
   * @param {string[]} studentIds - IDs agents étudiants
   * @returns {Promise<MentorshipResult>}
   */
  async establishMentorship(mentorId, studentIds) {
    throw new Error('establishMentorship must be implemented')
  }

  /**
   * 🧠 Démarrer session d'apprentissage créatif
   * @param {LearningConfig} config - Configuration apprentissage
   * @returns {Promise<LearningResult>}
   */
  async startCreativeLearning(config) {
    throw new Error('startCreativeLearning must be implemented')
  }
}

/**
 * Port pour l'analytics avancé
 */
class IAnalyticsPort {
  /**
   * 📊 Analyser tendances marché
   * @param {MarketAnalysisConfig} config - Configuration analyse
   * @returns {Promise<MarketInsights>}
   */
  async analyzeMarketTrends(config) {
    throw new Error('analyzeMarketTrends must be implemented')
  }

  /**
   * 🔮 Prédire performance futurer
   * @param {PredictionConfig} config - Configuration prédiction
   * @returns {Promise<PerformancePrediction>}
   */
  async predictFuturePerformance(config) {
    throw new Error('predictFuturePerformance must be implemented')
  }

  /**
   * 🎯 Identifier opportunités
   * @param {OpportunityConfig} config - Configuration recherche opportunités
   * @returns {Promise<Opportunity[]>}
   */
  async identifyOpportunities(config) {
    throw new Error('identifyOpportunities must be implemented')
  }

  /**
   * 🏆 Générer recommandations IA
   * @param {RecommendationConfig} config - Configuration recommandations
   * @returns {Promise<AIRecommendations>}
   */
  async generateAIRecommendations(config) {
    throw new Error('generateAIRecommendations must be implemented')
  }
}

// 📋 Type Definitions

/**
 * @typedef {Object} ProspectionCriteria
 * @property {string[]} industries - Industries cibles
 * @property {string[]} locations - Localisations
 * @property {string[]} jobTitles - Titres de poste
 * @property {string[]} companySize - Taille d'entreprise
 * @property {number} limit - Limite de résultats
 */

/**
 * @typedef {Object} ProspectionOptions
 * @property {boolean} useAI - Utiliser IA avancée
 * @property {string} strategy - Stratégie de prospection
 * @property {number} timeout - Timeout en ms
 * @property {boolean} enableCreativity - Activer mode créatif
 */

/**
 * @typedef {Object} ProspectionResult
 * @property {boolean} success - Succès de l'opération
 * @property {Prospect[]} prospects - Prospects trouvés
 * @property {number} total - Nombre total
 * @property {string} workflowId - ID du workflow
 * @property {number} executionTime - Temps d'exécution
 * @property {Object} metadata - Métadonnées
 */

/**
 * @typedef {Object} EmailEnrichmentOptions
 * @property {boolean} verify - Vérifier emails
 * @property {string[]} sources - Sources d'enrichissement
 * @property {number} batchSize - Taille des lots
 * @property {boolean} useAI - Utiliser IA pour génération
 */

/**
 * @typedef {Object} EnrichmentResult
 * @property {boolean} success - Succès
 * @property {Prospect[]} enrichedProspects - Prospects enrichis
 * @property {number} enrichmentRate - Taux d'enrichissement
 * @property {Object} qualityMetrics - Métriques qualité
 */

/**
 * @typedef {Object} WorkflowOptions
 * @property {string} priority - Priorité d'exécution
 * @property {boolean} parallel - Exécution parallèle
 * @property {number} retryAttempts - Tentatives de retry
 * @property {Object} agentConfig - Configuration agents
 */

/**
 * @typedef {Object} WorkflowResult
 * @property {boolean} success - Succès
 * @property {any} data - Données résultat
 * @property {string} workflowId - ID workflow
 * @property {number} executionTime - Temps d'exécution
 * @property {Object} teamInsights - Insights des équipes
 */

/**
 * @typedef {Object} SwarmOptions
 * @property {number} size - Taille du swarm
 * @property {string[]} agentTypes - Types d'agents
 * @property {number} timeout - Timeout
 * @property {boolean} creative - Mode créatif
 */

/**
 * @typedef {Object} SwarmResult
 * @property {boolean} success - Succès
 * @property {any[]} results - Résultats individuels
 * @property {number} swarmSize - Taille du swarm
 * @property {Object} performance - Métriques performance
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} totalWorkflows - Total workflows
 * @property {number} successRate - Taux de succès
 * @property {number} averageExecutionTime - Temps moyen
 * @property {Object} agentMetrics - Métriques agents
 * @property {Object} teamMetrics - Métriques équipes
 */

/**
 * @typedef {Object} SystemHealth
 * @property {string} status - Statut système
 * @property {Object} agents - Statut agents
 * @property {Object} teams - Statut équipes
 * @property {Object} resources - Utilisation ressources
 * @property {Date} timestamp - Timestamp
 */

/**
 * @typedef {Object} ExperimentConfig
 * @property {string} name - Nom expérience
 * @property {string} hypothesis - Hypothèse
 * @property {number} duration - Durée en ms
 * @property {string[]} metrics - Métriques à mesurer
 * @property {Object} testConfig - Config groupe test
 */

/**
 * @typedef {Object} ExperimentResult
 * @property {boolean} success - Succès
 * @property {string} conclusion - Conclusion
 * @property {Object} statistics - Statistiques
 * @property {boolean} significantImprovement - Amélioration significative
 * @property {Object} recommendations - Recommandations
 */

module.exports = {
  IProspectionPort,
  ICampaignPort,
  IAgentPort,
  IAnalyticsPort
}