/**
 * 🎯 Graixl Hexagonal Application - Point d'entrée principal
 * Architecture hexagonale complète avec système d'équipes intelligentes
 */

const ClaudeFlowProspectionAdapter = require('./adapters/ClaudeFlowProspectionAdapter')
const { Prospect, ContactInfo, ProspectionMetadata } = require('./core/domain/entities/Prospect')
const EventEmitter = require('events')

class GraixlHexagonalApp extends EventEmitter {
  constructor(config = {}) {
    super()
    
    this.config = {
      // Configuration Core
      environment: config.environment || 'production',
      enableAdvancedAI: config.enableAdvancedAI !== false,
      creativityLevel: config.creativityLevel || 'high',
      
      // Configuration Équipes
      maxTeams: config.maxTeams || 5,
      agentsPerTeam: config.agentsPerTeam || 4,
      enableMentorship: config.enableMentorship !== false,
      
      // Configuration Performance
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 20,
      adaptiveScaling: config.adaptiveScaling !== false,
      cacheEnabled: config.cacheEnabled !== false,
      
      // Configuration Monitoring
      metricsInterval: config.metricsInterval || 60000, // 1 minute
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 secondes
      
      // Configuration API
      apiPort: config.apiPort || 3000,
      enableCORS: config.enableCORS !== false,
      rateLimit: config.rateLimit || 1000 // requêtes par heure
    }
    
    // Core Components
    this.prospectionAdapter = null
    this.isInitialized = false
    this.startTime = null
    
    // Monitoring
    this.healthStatus = 'initializing'
    this.performanceMetrics = new Map()
    this.activeConnections = new Set()
    
    // Event Handlers
    this.setupEventHandlers()
  }

  async initialize() {
    console.log('🚀 Initializing Graixl Hexagonal Application...')
    this.startTime = Date.now()
    
    try {
      // Phase 1: Initialiser l'adaptateur principal
      await this.initializePrimaryAdapter()
      
      // Phase 2: Configurer les systèmes de monitoring
      await this.initializeMonitoring()
      
      // Phase 3: Démarrer les services core
      await this.startCoreServices()
      
      // Phase 4: Activer les optimisations adaptatives
      await this.enableAdaptiveOptimizations()
      
      this.isInitialized = true
      this.healthStatus = 'healthy'
      
      console.log('✅ Graixl Hexagonal Application initialized successfully')
      console.log(`📊 Environment: ${this.config.environment}`)
      console.log(`🤖 Advanced AI: ${this.config.enableAdvancedAI ? 'Enabled' : 'Disabled'}`)
      console.log(`🎨 Creativity Level: ${this.config.creativityLevel}`)
      
      this.emit('application_ready', {
        timestamp: new Date(),
        initializationTime: Date.now() - this.startTime,
        config: this.config
      })
      
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Graixl Application:', error)
      this.healthStatus = 'error'
      this.emit('initialization_failed', { error: error.message })
      return false
    }
  }

  // 🎯 API Principale - Prospection Intelligente

  async searchProspects(criteria, options = {}) {
    this.ensureInitialized()
    
    const requestId = this.generateRequestId()
    const startTime = performance.now()
    
    try {
      console.log(`🔍 Processing prospect search request: ${requestId}`)
      
      // Validation et enrichissement des critères
      const enrichedCriteria = await this.enrichSearchCriteria(criteria)
      const optimizedOptions = await this.optimizeSearchOptions(options)
      
      // Exécution via adaptateur avec monitoring
      const result = await this.prospectionAdapter.searchProspects(
        enrichedCriteria,
        optimizedOptions
      )
      
      const executionTime = performance.now() - startTime
      
      // Post-processing et analytics
      if (result.success) {
        await this.postProcessSearchResults(result, requestId)
        await this.updatePerformanceMetrics('search_prospects', {
          executionTime,
          prospectsFound: result.prospects.length,
          qualityScore: this.calculateAverageQuality(result.prospects)
        })
      }
      
      // Événement pour monitoring
      this.emit('search_completed', {
        requestId,
        success: result.success,
        prospectsFound: result.success ? result.prospects.length : 0,
        executionTime
      })
      
      return {
        ...result,
        requestId,
        executionTime: Math.round(executionTime)
      }
      
    } catch (error) {
      console.error(`❌ Prospect search failed (${requestId}):`, error)
      this.emit('search_failed', { requestId, error: error.message })
      
      return {
        success: false,
        error: error.message,
        requestId,
        executionTime: performance.now() - startTime
      }
    }
  }

  async enrichProspectsWithEmails(prospects, options = {}) {
    this.ensureInitialized()
    
    const requestId = this.generateRequestId()
    const startTime = performance.now()
    
    try {
      console.log(`📧 Processing email enrichment request: ${requestId}`)
      
      // Validation des prospects
      const validatedProspects = this.validateProspects(prospects)
      if (validatedProspects.length === 0) {
        throw new Error('No valid prospects provided for enrichment')
      }
      
      // Configuration optimisée pour enrichissement
      const enrichmentOptions = {
        verify: options.verify !== false,
        sources: options.sources || ['apollo', 'hunter', 'ai_generation'],
        batchSize: this.calculateOptimalBatchSize(validatedProspects.length),
        useAdvancedAI: this.config.enableAdvancedAI,
        creativityBoost: this.config.creativityLevel === 'high',
        ...options
      }
      
      // Exécution avec retry automatique
      const result = await this.executeWithRetry(() =>
        this.prospectionAdapter.enrichWithEmails(validatedProspects, enrichmentOptions)
      )
      
      const executionTime = performance.now() - startTime
      
      if (result.success) {
        await this.postProcessEnrichmentResults(result, requestId)
        await this.updatePerformanceMetrics('enrich_emails', {
          executionTime,
          prospectsProcessed: result.enrichedProspects.length,
          enrichmentRate: result.enrichmentRate
        })
      }
      
      this.emit('enrichment_completed', {
        requestId,
        success: result.success,
        prospectsProcessed: validatedProspects.length,
        enrichmentRate: result.success ? result.enrichmentRate : 0,
        executionTime
      })
      
      return {
        ...result,
        requestId,
        executionTime: Math.round(executionTime)
      }
      
    } catch (error) {
      console.error(`❌ Email enrichment failed (${requestId}):`, error)
      this.emit('enrichment_failed', { requestId, error: error.message })
      
      return {
        success: false,
        error: error.message,
        requestId,
        executionTime: performance.now() - startTime
      }
    }
  }

  async executeIntelligentWorkflow(workflowType, data, options = {}) {
    this.ensureInitialized()
    
    const requestId = this.generateRequestId()
    const startTime = performance.now()
    
    try {
      console.log(`🤖 Executing intelligent workflow: ${workflowType} (${requestId})`)
      
      // Validation du workflow
      const supportedWorkflows = this.getSupportedWorkflows()
      if (!supportedWorkflows.includes(workflowType)) {
        throw new Error(`Unsupported workflow: ${workflowType}`)
      }
      
      // Configuration intelligente du workflow
      const workflowOptions = await this.configureIntelligentWorkflow(workflowType, options)
      
      // Exécution avec coordination d'équipes
      const result = await this.prospectionAdapter.executeIntelligentWorkflow(
        workflowType,
        data,
        workflowOptions
      )
      
      const executionTime = performance.now() - startTime
      
      if (result.success) {
        await this.postProcessWorkflowResults(result, workflowType, requestId)
        await this.updatePerformanceMetrics(`workflow_${workflowType}`, {
          executionTime,
          dataSize: this.calculateDataSize(data),
          teamsInvolved: result.metadata?.teamsInvolved?.length || 0
        })
      }
      
      this.emit('workflow_completed', {
        requestId,
        workflowType,
        success: result.success,
        teamsInvolved: result.metadata?.teamsInvolved || [],
        executionTime
      })
      
      return {
        ...result,
        requestId,
        executionTime: Math.round(executionTime)
      }
      
    } catch (error) {
      console.error(`❌ Intelligent workflow failed (${requestId}):`, error)
      this.emit('workflow_failed', { requestId, workflowType, error: error.message })
      
      return {
        success: false,
        error: error.message,
        requestId,
        workflowType,
        executionTime: performance.now() - startTime
      }
    }
  }

  async quickSwarmSearch(query, options = {}) {
    this.ensureInitialized()
    
    const requestId = this.generateRequestId()
    const startTime = performance.now()
    
    try {
      console.log(`⚡ Executing quick swarm search: ${requestId}`)
      
      // Optimisation pour rapidité maximale
      const swarmOptions = {
        size: options.size || 3,
        timeout: options.timeout || 10000, // 10 secondes max
        agentTypes: options.agentTypes || ['ProspectSearcher'],
        creative: options.creative || false,
        priorityLevel: 'high'
      }
      
      const result = await this.prospectionAdapter.quickSwarmSearch(query, swarmOptions)
      
      const executionTime = performance.now() - startTime
      
      if (result.success) {
        await this.updatePerformanceMetrics('quick_swarm_search', {
          executionTime,
          swarmSize: result.swarmSize,
          resultsFound: result.results.length
        })
      }
      
      this.emit('swarm_search_completed', {
        requestId,
        query,
        success: result.success,
        swarmSize: result.swarmSize,
        resultsFound: result.success ? result.results.length : 0,
        executionTime
      })
      
      return {
        ...result,
        requestId,
        executionTime: Math.round(executionTime)
      }
      
    } catch (error) {
      console.error(`❌ Quick swarm search failed (${requestId}):`, error)
      this.emit('swarm_search_failed', { requestId, error: error.message })
      
      return {
        success: false,
        error: error.message,
        requestId,
        executionTime: performance.now() - startTime
      }
    }
  }

  // 🧪 Système d'Expérimentation Créative

  async runCreativeExperiment(config) {
    this.ensureInitialized()
    
    const experimentId = this.generateExperimentId()
    
    try {
      console.log(`🧪 Running creative experiment: ${config.name} (${experimentId})`)
      
      // Validation de la configuration
      this.validateExperimentConfig(config)
      
      // Exécution de l'expérience
      const result = await this.prospectionAdapter.runCreativeExperiment({
        ...config,
        experimentId,
        applicationContext: {
          environment: this.config.environment,
          creativityLevel: this.config.creativityLevel
        }
      })
      
      // Logging des résultats
      if (result.success && result.significantImprovement) {
        console.log(`✅ Experiment ${config.name} shows significant improvement!`)
        await this.considerExperimentAdoption(config, result)
      }
      
      this.emit('experiment_completed', {
        experimentId,
        name: config.name,
        success: result.success,
        significantImprovement: result.significantImprovement
      })
      
      return {
        ...result,
        experimentId
      }
      
    } catch (error) {
      console.error(`❌ Creative experiment failed: ${config.name}`, error)
      this.emit('experiment_failed', { experimentId, name: config.name, error: error.message })
      
      return {
        success: false,
        error: error.message,
        experimentId
      }
    }
  }

  // 📊 Monitoring et Analytics

  async getPerformanceMetrics() {
    this.ensureInitialized()
    
    try {
      // Métriques de l'adaptateur
      const adapterMetrics = await this.prospectionAdapter.getPerformanceMetrics()
      
      // Métriques de l'application
      const appMetrics = this.getApplicationMetrics()
      
      // Métriques combinées
      return {
        timestamp: new Date(),
        application: appMetrics,
        adapter: adapterMetrics,
        combined: {
          totalRequestsProcessed: appMetrics.totalRequests,
          averageResponseTime: appMetrics.averageResponseTime,
          successRate: appMetrics.successRate,
          systemHealth: this.healthStatus,
          uptime: Date.now() - this.startTime
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
    try {
      // Santé de l'adaptateur
      const adapterHealth = await this.prospectionAdapter?.getSystemHealth()
      
      // Santé de l'application
      const appHealth = {
        status: this.healthStatus,
        initialized: this.isInitialized,
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        activeConnections: this.activeConnections.size,
        memoryUsage: process.memoryUsage()
      }
      
      return {
        application: appHealth,
        adapter: adapterHealth,
        overall: this.calculateOverallHealth(appHealth, adapterHealth),
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

  // 🔧 Méthodes de Configuration et Initialisation

  async initializePrimaryAdapter() {
    console.log('🔧 Initializing primary adapter...')
    
    this.prospectionAdapter = new ClaudeFlowProspectionAdapter({
      teamConfig: {
        maxTeams: this.config.maxTeams,
        agentsPerTeam: this.config.agentsPerTeam,
        enableMentorship: this.config.enableMentorship,
        creativityLevel: this.config.creativityLevel
      },
      maxConcurrentWorkflows: this.config.maxConcurrentWorkflows,
      enableAdvancedAI: this.config.enableAdvancedAI,
      adaptiveScaling: this.config.adaptiveScaling
    })
    
    const success = await this.prospectionAdapter.initialize()
    if (!success) {
      throw new Error('Failed to initialize prospection adapter')
    }
    
    console.log('✅ Primary adapter initialized')
  }

  async initializeMonitoring() {
    console.log('📊 Initializing monitoring systems...')
    
    // Démarrer les intervalles de monitoring
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, this.config.metricsInterval)
    
    setInterval(() => {
      this.performHealthCheck()
    }, this.config.healthCheckInterval)
    
    console.log('✅ Monitoring systems initialized')
  }

  async startCoreServices() {
    console.log('🚀 Starting core services...')
    
    // Services de cache si activé
    if (this.config.cacheEnabled) {
      await this.initializeCache()
    }
    
    // Services de logging
    await this.initializeLogging()
    
    console.log('✅ Core services started')
  }

  async enableAdaptiveOptimizations() {
    if (!this.config.adaptiveScaling) return
    
    console.log('🎯 Enabling adaptive optimizations...')
    
    // Optimisations basées sur l'historique
    this.adaptiveOptimizer = {
      enabled: true,
      optimizationHistory: [],
      learningRate: 0.1
    }
    
    console.log('✅ Adaptive optimizations enabled')
  }

  // 🔧 Méthodes Utilitaires

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Application not initialized. Call initialize() first.')
    }
  }

  setupEventHandlers() {
    // Gestion des erreurs non gérées
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      this.emit('unhandled_error', { type: 'rejection', reason })
    })
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      this.emit('unhandled_error', { type: 'exception', error })
    })
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }

  generateExperimentId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }

  getSupportedWorkflows() {
    return [
      'intelligent_prospection',
      'creative_email_campaign',
      'market_analysis',
      'quality_audit',
      'innovation_research',
      'predictive_optimization',
      'competitive_intelligence'
    ]
  }

  async executeWithRetry(operation, maxRetries = 3) {
    let lastError
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          console.log(`Retry attempt ${attempt}/${maxRetries} after error:`, error.message)
          await this.sleep(1000 * attempt) // Exponential backoff
        }
      }
    }
    
    throw lastError
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Interface publique pour arrêt propre
  async shutdown() {
    console.log('🛑 Shutting down Graixl Hexagonal Application...')
    
    this.healthStatus = 'shutting_down'
    
    // Arrêter l'adaptateur
    if (this.prospectionAdapter) {
      await this.prospectionAdapter.shutdown()
    }
    
    // Nettoyer les ressources
    this.activeConnections.clear()
    this.performanceMetrics.clear()
    
    this.isInitialized = false
    this.healthStatus = 'stopped'
    
    this.emit('application_shutdown', {
      timestamp: new Date(),
      uptime: Date.now() - this.startTime
    })
    
    console.log('✅ Application shut down successfully')
  }
}

module.exports = GraixlHexagonalApp