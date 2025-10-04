/**
 * 🚀 API Hexagonal Graixl - Point d'entrée Vercel
 * Interface REST pour l'architecture hexagonale avec équipes intelligentes
 */

const GraixlHexagonalApp = require('../src/GraixlHexagonalApp')

// Instance globale de l'application (singleton pour Vercel)
let graixlApp = null
let initializationPromise = null

/**
 * Initialisation lazy de l'application
 */
async function ensureAppInitialized() {
  if (!graixlApp) {
    graixlApp = new GraixlHexagonalApp({
      environment: 'production',
      enableAdvancedAI: true,
      creativityLevel: 'high',
      maxTeams: 5,
      agentsPerTeam: 4,
      enableMentorship: true,
      adaptiveScaling: true,
      cacheEnabled: true
    })
    
    // Éviter les initialisations multiples
    if (!initializationPromise) {
      initializationPromise = graixlApp.initialize()
    }
    
    await initializationPromise
  }
  
  return graixlApp
}

/**
 * Gestionnaire principal Vercel
 */
module.exports = async (req, res) => {
  // Configuration CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  try {
    const app = await ensureAppInitialized()
    const { url, method } = req

    // 🔍 Endpoint: Recherche de prospects intelligente
    if (method === 'POST' && url.includes('/api/hexagonal/search-prospects')) {
      const body = await parseRequestBody(req)
      
      const result = await app.searchProspects(body.criteria || {}, body.options || {})
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'search-prospects',
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // 📧 Endpoint: Enrichissement email
    if (method === 'POST' && url.includes('/api/hexagonal/enrich-emails')) {
      const body = await parseRequestBody(req)
      
      if (!body.prospects || !Array.isArray(body.prospects)) {
        res.writeHead(400)
        res.end(JSON.stringify({ 
          success: false, 
          error: 'prospects array is required' 
        }))
        return
      }
      
      const result = await app.enrichProspectsWithEmails(body.prospects, body.options || {})
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'enrich-emails',
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // 🤖 Endpoint: Workflow intelligent
    if (method === 'POST' && url.includes('/api/hexagonal/workflow')) {
      const body = await parseRequestBody(req)
      
      if (!body.workflowType) {
        res.writeHead(400)
        res.end(JSON.stringify({ 
          success: false, 
          error: 'workflowType is required' 
        }))
        return
      }
      
      const result = await app.executeIntelligentWorkflow(
        body.workflowType,
        body.data || {},
        body.options || {}
      )
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'intelligent-workflow',
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // ⚡ Endpoint: Recherche rapide swarm
    if (method === 'POST' && url.includes('/api/hexagonal/quick-search')) {
      const body = await parseRequestBody(req)
      
      if (!body.query) {
        res.writeHead(400)
        res.end(JSON.stringify({ 
          success: false, 
          error: 'query is required' 
        }))
        return
      }
      
      const result = await app.quickSwarmSearch(body.query, body.options || {})
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'quick-swarm-search',
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // 🧪 Endpoint: Expérience créative
    if (method === 'POST' && url.includes('/api/hexagonal/experiment')) {
      const body = await parseRequestBody(req)
      
      if (!body.name || !body.hypothesis) {
        res.writeHead(400)
        res.end(JSON.stringify({ 
          success: false, 
          error: 'name and hypothesis are required' 
        }))
        return
      }
      
      const result = await app.runCreativeExperiment(body)
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'creative-experiment',
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }))
      return
    }

    // 📊 Endpoint: Métriques de performance
    if (method === 'GET' && url.includes('/api/hexagonal/metrics')) {
      const result = await app.getPerformanceMetrics()
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'performance-metrics',
        architecture: 'hexagonal'
      }))
      return
    }

    // 🔍 Endpoint: Santé du système
    if (method === 'GET' && url.includes('/api/hexagonal/health')) {
      const result = await app.getSystemHealth()
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...result,
        endpoint: 'system-health',
        architecture: 'hexagonal'
      }))
      return
    }

    // 🎯 Endpoint: Prospection complète (compatible avec interface)
    if (method === 'POST' && url.includes('/api/hexagonal/full-prospection')) {
      const body = await parseRequestBody(req)
      
      const sector = body.sector || body.industry || 'technology'
      
      // Mapping secteur vers critères complets
      const criteria = mapSectorToCriteria(sector)
      const options = {
        useAI: true,
        enableCreativity: true,
        strategy: 'intelligent_multi_team',
        timeout: 120000 // 2 minutes
      }
      
      const result = await app.executeIntelligentWorkflow(
        'intelligent_prospection',
        { criteria, sector },
        options
      )
      
      // Format compatible avec l'interface existante
      const compatibleResult = {
        success: result.success,
        prospects: result.success ? (result.data?.prospects || []) : [],
        total: result.success ? (result.data?.prospects?.length || 0) : 0,
        industry: sector,
        dataSource: 'hexagonal-architecture',
        workflowId: result.workflowId,
        executionTime: result.executionTime,
        teamInsights: result.teamInsights,
        architecture: 'hexagonal',
        timestamp: new Date().toISOString()
      }
      
      res.writeHead(200)
      res.end(JSON.stringify(compatibleResult))
      return
    }

    // 📋 Endpoint: Documentation API
    if (method === 'GET' && url.includes('/api/hexagonal/docs')) {
      const documentation = generateAPIDocumentation()
      
      res.writeHead(200)
      res.end(JSON.stringify(documentation))
      return
    }

    // ❌ Endpoint non trouvé
    res.writeHead(404)
    res.end(JSON.stringify({
      success: false,
      error: 'Endpoint not found',
      architecture: 'hexagonal',
      availableEndpoints: [
        'POST /api/hexagonal/search-prospects',
        'POST /api/hexagonal/enrich-emails',
        'POST /api/hexagonal/workflow',
        'POST /api/hexagonal/quick-search',
        'POST /api/hexagonal/experiment',
        'POST /api/hexagonal/full-prospection',
        'GET /api/hexagonal/metrics',
        'GET /api/hexagonal/health',
        'GET /api/hexagonal/docs'
      ],
      timestamp: new Date().toISOString()
    }))

  } catch (error) {
    console.error('❌ API Error:', error)
    
    res.writeHead(500)
    res.end(JSON.stringify({
      success: false,
      error: error.message,
      architecture: 'hexagonal',
      timestamp: new Date().toISOString()
    }))
  }
}

/**
 * Parse request body (compatible Vercel)
 */
async function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(new Error('Invalid JSON body'))
      }
    })
    
    req.on('error', reject)
  })
}

/**
 * Mapping secteur vers critères de prospection
 */
function mapSectorToCriteria(sector) {
  const sectorMapping = {
    banking: {
      industries: ['Financial Services', 'Banking', 'Insurance'],
      jobTitles: ['Head of Talent', 'HR Director', 'Talent Acquisition', 'Chief People Officer'],
      companySize: ['201-500', '501-1000', '1001-5000'],
      locations: ['France', 'Belgium', 'Switzerland'],
      limit: 25
    },
    ecommerce: {
      industries: ['E-commerce', 'Retail', 'Consumer Goods'],
      jobTitles: ['VP People', 'Talent Manager', 'HR Business Partner', 'Recruitment Lead'],
      companySize: ['51-200', '201-500', '501-1000'],
      locations: ['France', 'Germany', 'Belgium'],
      limit: 20
    },
    gaming: {
      industries: ['Gaming', 'Entertainment', 'Software'],
      jobTitles: ['Talent Manager', 'HR Manager', 'People Operations', 'Recruiting Lead'],
      companySize: ['11-50', '51-200', '201-500'],
      locations: ['France', 'Canada', 'UK'],
      limit: 15
    },
    technology: {
      industries: ['Technology', 'Software', 'SaaS', 'AI'],
      jobTitles: ['Head of Talent', 'Technical Recruiter', 'People Manager', 'HR Director'],
      companySize: ['51-200', '201-500', '501-1000'],
      locations: ['France', 'Germany', 'Netherlands'],
      limit: 30
    }
  }
  
  return sectorMapping[sector] || sectorMapping.technology
}

/**
 * Génération documentation API
 */
function generateAPIDocumentation() {
  return {
    title: '🏗️ Graixl Hexagonal Architecture API',
    version: '1.0.0',
    description: 'API pour système de prospection avec architecture hexagonale et équipes d\'agents intelligents',
    architecture: 'hexagonal',
    features: [
      '🤖 Multi-agent intelligent teams',
      '🎯 Advanced AI prospection',
      '📧 Creative email enrichment',
      '⚡ Lightning-fast swarm search',
      '🧪 Creative experimentation',
      '📊 Real-time analytics',
      '🔄 Adaptive optimization'
    ],
    endpoints: {
      'POST /api/hexagonal/search-prospects': {
        description: 'Recherche intelligente de prospects avec coordination d\'équipes',
        body: {
          criteria: {
            industries: ['string[]'],
            locations: ['string[]'],
            jobTitles: ['string[]'],
            companySize: ['string[]'],
            limit: 'number'
          },
          options: {
            useAI: 'boolean',
            enableCreativity: 'boolean',
            strategy: 'string',
            timeout: 'number'
          }
        }
      },
      'POST /api/hexagonal/enrich-emails': {
        description: 'Enrichissement email avec IA avancée',
        body: {
          prospects: ['Prospect[]'],
          options: {
            verify: 'boolean',
            sources: ['string[]'],
            useAI: 'boolean'
          }
        }
      },
      'POST /api/hexagonal/workflow': {
        description: 'Exécution de workflows intelligents multi-équipes',
        body: {
          workflowType: 'string (required)',
          data: 'any',
          options: 'object'
        }
      },
      'POST /api/hexagonal/quick-search': {
        description: 'Recherche rapide avec swarm d\'agents',
        body: {
          query: 'string (required)',
          options: {
            size: 'number',
            timeout: 'number',
            creative: 'boolean'
          }
        }
      },
      'POST /api/hexagonal/experiment': {
        description: 'Lancement d\'expériences créatives',
        body: {
          name: 'string (required)',
          hypothesis: 'string (required)',
          duration: 'number',
          metrics: ['string[]']
        }
      },
      'GET /api/hexagonal/metrics': {
        description: 'Métriques de performance du système'
      },
      'GET /api/hexagonal/health': {
        description: 'État de santé du système et des équipes'
      }
    },
    examples: {
      searchProspects: {
        url: '/api/hexagonal/search-prospects',
        method: 'POST',
        body: {
          criteria: {
            industries: ['Technology', 'SaaS'],
            jobTitles: ['Head of Talent', 'HR Director'],
            locations: ['France'],
            limit: 20
          },
          options: {
            useAI: true,
            enableCreativity: true,
            strategy: 'intelligent_multi_team'
          }
        }
      },
      quickSearch: {
        url: '/api/hexagonal/quick-search',
        method: 'POST',
        body: {
          query: 'CTO startup Paris',
          options: {
            size: 3,
            timeout: 10000,
            creative: true
          }
        }
      }
    },
    timestamp: new Date().toISOString()
  }
}