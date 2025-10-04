/**
 * 🔧 Claude Flow Prospection Adapter - Hexagonal Architecture
 * Adaptateur qui connecte le domaine métier avec le système Claude Flow
 */

const { IProspectionPort, ICampaignPort, IAgentPort, IAnalyticsPort } = require('../core/ports/IProspectionPort')
const { IntelligentTeamSimulation } = require('../core/agents/IntelligentTeamSimulation')
const { Prospect } = require('../core/domain/entities/Prospect')

class ClaudeFlowProspectionAdapter extends IProspectionPort {
  constructor(options = {}) {
    super()
    
    this.teamSimulation = new IntelligentTeamSimulation(options.teamConfig)
    this.config = {
      maxConcurrentWorkflows: options.maxConcurrentWorkflows || 10,
      defaultTimeout: options.defaultTimeout || 300000, // 5 minutes
      enableAdvancedAI: options.enableAdvancedAI || true,
      creativityLevel: options.creativityLevel || 'high',
      adaptiveScaling: options.adaptiveScaling || true
    }
    
    this.isInitialized = false
    this.activeWorkflows = new Map()
    this.performanceCache = new Map()
    
    // Event listeners pour monitoring
    this.setupEventListeners()
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Claude Flow Prospection Adapter...')
      
      // Initialiser le système d'équipes intelligentes
      const success = await this.teamSimulation.initialize()
      if (!success) {
        throw new Error('Failed to initialize Intelligent Team Simulation')
      }
      
      // Initialiser les systèmes de cache et monitoring
      await this.initializePerformanceTracking()
      await this.initializeAdaptiveOptimization()
      
      this.isInitialized = true
      console.log('✅ Claude Flow Prospection Adapter initialized successfully')
      
      return true
    } catch (error) {
      console.error('❌ Failed to initialize Claude Flow Adapter:', error)
      return false
    }
  }

  // 🎯 Implémentation IProspectionPort
  
  async searchProspects(criteria, options = {}) {
    this.ensureInitialized()
    
    const workflowId = this.generateWorkflowId('search_prospects')
    const startTime = Date.now()
    
    try {
      console.log(`🔍 Starting intelligent prospect search: ${workflowId}`)
      
      // Transformation des critères en format interne
      const internalCriteria = this.transformSearchCriteria(criteria)
      
      // Configuration du workflow avec options avancées
      const workflowConfig = {
        type: 'intelligent_prospection',
        criteria: internalCriteria,
        options: {
          ...options,
          useAI: options.useAI !== false,
          enableCreativity: options.enableCreativity || this.config.creativityLevel === 'high',
          timeout: options.timeout || this.config.defaultTimeout
        }
      }
      
      // Exécution via système d'équipes intelligentes
      const result = await this.teamSimulation.executeTeamWorkflow(
        'intelligent_prospection',
        workflowConfig,
        { workflowId }
      )
      
      // Transformation des résultats en entités domaine
      const prospects = result.prospects.map(p => this.transformToProspectEntity(p))
      
      const executionTime = Date.now() - startTime
      
      // Logging et analytics
      await this.trackWorkflowSuccess(workflowId, {
        type: 'search_prospects',
        prospectsFound: prospects.length,
        executionTime,
        qualityScore: this.calculateAverageQuality(prospects)
      })
      
      return {
        success: true,
        prospects,
        total: prospects.length,
        workflowId,
        executionTime,
        metadata: {
          criteria: internalCriteria,
          teamInsights: result.teamInsights,
          qualityMetrics: result.qualityMetrics
        }
      }
      
    } catch (error) {
      console.error(`❌ Prospect search failed (${workflowId}):`, error)
      await this.trackWorkflowFailure(workflowId, error)
      
      return {
        success: false,
        error: error.message,
        workflowId,
        executionTime: Date.now() - startTime
      }
    }
  }

  async enrichWithEmails(prospects, options = {}) {
    this.ensureInitialized()
    
    const workflowId = this.generateWorkflowId('enrich_emails')
    const startTime = Date.now()
    
    try {
      console.log(`📧 Starting email enrichment: ${workflowId}`)
      
      // Validation des prospects
      const validProspects = prospects.filter(p => p instanceof Prospect)
      if (validProspects.length === 0) {
        throw new Error('No valid prospects provided for enrichment')
      }
      
      // Configuration enrichissement
      const enrichmentConfig = {
        prospects: validProspects.map(p => p.toJSON()),
        options: {
          verify: options.verify !== false,
          sources: options.sources || ['apollo', 'hunter', 'pattern_generation'],
          batchSize: options.batchSize || 10,
          useAI: options.useAI !== false,
          enableCreativePatterns: options.enableCreativePatterns || true
        }
      }
      
      // Exécution via équipe Email Intelligence
      const result = await this.teamSimulation.executeTeamWorkflow(
        'creative_email_campaign',
        enrichmentConfig,
        { workflowId, mode: 'enrichment_only' }
      )
      
      // Mise à jour des entités Prospect
      const enrichedProspects = this.updateProspectsWithEnrichment(validProspects, result.enrichmentData)
      
      const executionTime = Date.now() - startTime
      const enrichmentRate = this.calculateEnrichmentRate(enrichedProspects)
      
      await this.trackWorkflowSuccess(workflowId, {
        type: 'enrich_emails',
        prospectsProcessed: enrichedProspects.length,
        enrichmentRate,
        executionTime
      })
      
      return {
        success: true,
        enrichedProspects,
        enrichmentRate,
        qualityMetrics: {
          totalProcessed: enrichedProspects.length,
          emailsFound: enrichedProspects.filter(p => p.hasValidEmail()).length,
          verificationRate: enrichedProspects.filter(p => p.contactInfo.isEmailVerified()).length / enrichedProspects.length,
          averageConfidence: this.calculateAverageConfidence(enrichedProspects)
        },
        workflowId,
        executionTime
      }
      
    } catch (error) {
      console.error(`❌ Email enrichment failed (${workflowId}):`, error)
      await this.trackWorkflowFailure(workflowId, error)
      
      return {
        success: false,
        error: error.message,
        workflowId,
        executionTime: Date.now() - startTime
      }
    }
  }

  async executeIntelligentWorkflow(workflowType, data, options = {}) {
    this.ensureInitialized()
    
    const workflowId = this.generateWorkflowId(workflowType)
    const startTime = Date.now()
    
    try {
      console.log(`🤖 Executing intelligent workflow: ${workflowType} (${workflowId})`)
      
      // Validation du type de workflow
      const supportedWorkflows = [
        'intelligent_prospection',
        'creative_email_campaign', 
        'market_analysis',
        'quality_audit',
        'innovation_research',
        'predictive_optimization'
      ]
      
      if (!supportedWorkflows.includes(workflowType)) {
        throw new Error(`Unsupported workflow type: ${workflowType}`)
      }
      
      // Configuration avancée du workflow
      const workflowConfig = this.buildAdvancedWorkflowConfig(workflowType, data, options)
      
      // Exécution via système d'équipes avec coordination intelligente
      const result = await this.teamSimulation.executeTeamWorkflow(
        workflowType,
        data,
        {
          ...workflowConfig,
          workflowId,
          enableTeamCoordination: true,
          adaptivePriority: this.calculateWorkflowPriority(workflowType, data)
        }
      )
      
      const executionTime = Date.now() - startTime
      
      // Post-processing et analytics avancés
      const processedResult = await this.postProcessWorkflowResult(workflowType, result)
      
      await this.trackWorkflowSuccess(workflowId, {
        type: workflowType,
        dataSize: this.getDataSize(data),
        executionTime,
        teamsInvolved: result.teamsInvolved || [],
        innovationScore: processedResult.innovationScore || 0
      })
      
      return {
        success: true,
        data: processedResult.data,
        workflowId,
        executionTime,
        teamInsights: processedResult.teamInsights,
        recommendations: processedResult.recommendations,
        metadata: {
          workflowType,
          teamsInvolved: result.teamsInvolved,
          performanceMetrics: processedResult.performanceMetrics
        }
      }
      
    } catch (error) {
      console.error(`❌ Intelligent workflow failed (${workflowId}):`, error)
      await this.trackWorkflowFailure(workflowId, error)
      
      return {
        success: false,
        error: error.message,
        workflowId,
        executionTime: Date.now() - startTime
      }
    }
  }

  async quickSwarmSearch(query, options = {}) {
    this.ensureInitialized()
    
    const swarmId = this.generateSwarmId()
    const startTime = Date.now()
    
    try {
      console.log(`⚡ Starting quick swarm search: ${swarmId}`)
      
      // Configuration du swarm optimisée pour rapidité
      const swarmConfig = {
        type: 'search',
        data: { 
          query,
          options: {
            ...options,
            optimizeForSpeed: true,
            maxResults: options.limit || 20
          }
        }
      }
      
      const swarmOptions = {
        size: options.size || 3,
        agents: options.agentTypes || ['ProspectSearcher'],
        timeout: options.timeout || 15000, // 15 secondes pour quick search
        enableCreativity: options.creative || false
      }
      
      // Lancement du swarm via système d'équipes
      const result = await this.teamSimulation.spawnSwarm(swarmConfig, swarmOptions)
      
      const executionTime = Date.now() - startTime
      
      // Consolidation des résultats de swarm
      const consolidatedResults = this.consolidateSwarmResults(result.results)
      
      await this.trackSwarmExecution(swarmId, {
        query,
        swarmSize: result.swarmSize,
        successfulAgents: result.results.length,
        executionTime
      })
      
      return {
        success: true,
        results: consolidatedResults,
        swarmSize: result.swarmSize,
        performance: {
          executionTime,
          agentsSuccessful: result.results.length,
          agentsFailed: result.errors.length,
          averageResponseTime: executionTime / result.swarmSize
        },
        swarmId
      }
      
    } catch (error) {
      console.error(`❌ Quick swarm search failed (${swarmId}):`, error)
      
      return {
        success: false,
        error: error.message,
        swarmId,
        executionTime: Date.now() - startTime
      }
    }
  }

  async getPerformanceMetrics() {
    this.ensureInitialized()
    
    try {
      // Métriques du système d'équipes
      const teamMetrics = await this.teamSimulation.getSystemHealth()
      
      // Métriques d'adapter spécifiques
      const adapterMetrics = this.getAdapterMetrics()
      
      // Métriques de cache et optimisation
      const cacheMetrics = this.getCacheMetrics()
      
      return {
        timestamp: new Date(),
        system: {
          status: teamMetrics.status,
          uptime: Date.now() - this.initializationTime,
          activeWorkflows: this.activeWorkflows.size,
          totalWorkflowsExecuted: adapterMetrics.totalWorkflows
        },
        teams: teamMetrics.teams,
        performance: {
          averageExecutionTime: adapterMetrics.averageExecutionTime,
          successRate: adapterMetrics.successRate,
          throughput: adapterMetrics.throughput,
          qualityScore: adapterMetrics.averageQualityScore
        },
        cache: cacheMetrics,
        adaptive: {
          optimizationsApplied: adapterMetrics.optimizationsApplied,
          learningProgress: adapterMetrics.learningProgress,
          innovationIndex: adapterMetrics.innovationIndex
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error)
      return {
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  async getSystemHealth() {
    this.ensureInitialized()
    
    try {
      const teamHealth = await this.teamSimulation.getSystemHealth()
      
      return {
        status: this.isInitialized ? 'healthy' : 'unhealthy',
        adapter: {
          initialized: this.isInitialized,
          activeWorkflows: this.activeWorkflows.size,
          resourceUsage: this.calculateResourceUsage()
        },
        teams: teamHealth.teams,
        globalMetrics: teamHealth.globalMetrics,
        timestamp: new Date()
      }
      
    } catch (error) {
      console.error('❌ Failed to get system health:', error)
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  async runCreativeExperiment(config) {
    this.ensureInitialized()
    
    try {
      console.log(`🧪 Running creative experiment: ${config.name}`)
      
      // Validation de la configuration
      this.validateExperimentConfig(config)
      
      // Exécution via système d'équipes
      const result = await this.teamSimulation.runCreativeExperiment({
        ...config,
        adapter: 'ClaudeFlowProspectionAdapter',
        timestamp: new Date()
      })
      
      // Post-processing des résultats
      const processedResult = await this.processExperimentResult(result)
      
      return {
        success: true,
        experiment: config.name,
        conclusion: processedResult.conclusion,
        statistics: processedResult.statistics,
        significantImprovement: processedResult.significantImprovement,
        recommendations: processedResult.recommendations,
        timestamp: new Date()
      }
      
    } catch (error) {
      console.error(`❌ Creative experiment failed: ${config.name}`, error)
      return {
        success: false,
        error: error.message,
        experiment: config.name,
        timestamp: new Date()
      }
    }
  }

  // 🔧 Méthodes utilitaires privées

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('ClaudeFlowProspectionAdapter not initialized. Call initialize() first.')
    }
  }

  setupEventListeners() {
    this.teamSimulation.on('workflow_completed', (result) => {
      this.handleWorkflowCompleted(result)
    })
    
    this.teamSimulation.on('agent_error', (error, agent) => {
      this.handleAgentError(error, agent)
    })
    
    this.teamSimulation.on('creative_breakthrough', (breakthrough) => {
      this.handleCreativeBreakthrough(breakthrough)
    })
  }

  transformSearchCriteria(criteria) {
    return {
      industries: criteria.industries || [],
      locations: criteria.locations || ['France'],
      jobTitles: criteria.jobTitles || [],
      companySize: criteria.companySize || [],
      limit: criteria.limit || 50,
      minQualityScore: criteria.minQualityScore || 80
    }
  }

  transformToProspectEntity(prospectData) {
    return Prospect.fromJSON(prospectData)
  }

  calculateAverageQuality(prospects) {
    if (prospects.length === 0) return 0
    return prospects.reduce((sum, p) => sum + p.calculateGraixlScore(), 0) / prospects.length
  }

  generateWorkflowId(prefix = 'workflow') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateSwarmId() {
    return `swarm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  async trackWorkflowSuccess(workflowId, metrics) {
    // Enregistrement des métriques de succès
    console.log(`✅ Workflow ${workflowId} completed successfully:`, metrics)
  }

  async trackWorkflowFailure(workflowId, error) {
    // Enregistrement des échecs pour amélioration
    console.error(`❌ Workflow ${workflowId} failed:`, error.message)
  }

  async trackSwarmExecution(swarmId, metrics) {
    // Suivi spécifique des performances de swarm
    console.log(`⚡ Swarm ${swarmId} metrics:`, metrics)
  }

  // Méthodes d'initialisation

  async initializePerformanceTracking() {
    this.initializationTime = Date.now()
    this.performanceMetrics = {
      totalWorkflows: 0,
      successfulWorkflows: 0,
      averageExecutionTime: 0,
      averageQualityScore: 0,
      optimizationsApplied: 0
    }
  }

  async initializeAdaptiveOptimization() {
    // Système d'optimisation adaptive basé sur l'historique
    this.adaptiveOptimizer = {
      learningEnabled: true,
      optimizationHistory: [],
      currentOptimizations: new Map()
    }
  }

  // Interface publique pour nettoyage
  async shutdown() {
    console.log('🛑 Shutting down Claude Flow Prospection Adapter...')
    
    if (this.teamSimulation) {
      await this.teamSimulation.shutdown()
    }
    
    this.activeWorkflows.clear()
    this.performanceCache.clear()
    this.isInitialized = false
    
    console.log('✅ Adapter shut down successfully')
  }
}

module.exports = ClaudeFlowProspectionAdapter