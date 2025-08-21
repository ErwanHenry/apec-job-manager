# 📡 API Documentation - Kaspa Community Tool

## Vue d'ensemble de l'API

L'API Kaspa Community Tool expose plusieurs interfaces pour interagir avec le système multi-agents. Elle est disponible en deux versions :

- **FastAPI (Python)** : `http://localhost:8000` - Version complète pour développement
- **Vercel Functions (Node.js)** : `https://kaspa-community-tool.vercel.app` - Version déployée

## Architecture API

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │  Web Interface  │    │  Mobile Apps    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────────────────────┐
                    │           API Gateway               │
                    │                                     │
                    │ • Rate Limiting                     │
                    │ • Authentication                    │
                    │ • Request Validation                │
                    └─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FastAPI Core   │    │ Vercel Functions│    │  WebSocket API  │
│                 │    │                 │    │                 │
│ • Multi-agents  │    │ • Health checks │    │ • Real-time     │
│ • Workflows     │    │ • Social media  │    │ • Notifications │
│ • RAG System    │    │ • Basic routing │    │ • Live updates  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Endpoints FastAPI (Python)

### 🏠 Endpoint Racine

```http
GET /
```

**Description** : Point d'entrée principal de l'API avec informations système

**Response** :
```json
{
  "message": "🚀 Kaspa Community Tool API",
  "version": "0.3.0",
  "services": ["BlablaKAS", "KAScomodation"],
  "endpoints": {
    "docs": "/docs",
    "route": "/route",
    "agents": "/agents/{agent_name}/act",
    "workflow": "/workflow/feature_launch"
  }
}
```

### 🧭 Routage Intelligent

```http
POST /route
```

**Description** : Route automatiquement une requête vers l'agent approprié

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "text": "Comment créer une FAQ pour les annulations BlablaKAS ?"
}
```

**Response** :
```json
{
  "agent": "blablakas_ops",
  "confidence": 0.95,
  "reasoning": "Keywords detected: FAQ, annulations, BlablaKAS",
  "alternatives": [
    {
      "agent": "product_builder",
      "confidence": 0.23
    }
  ]
}
```

**Algorithme de Routage** :
1. **Extraction de mots-clés** : TF-IDF sur le texte d'entrée
2. **Classification** : Correspondance avec les domaines d'expertise
3. **Scoring** : Calcul de confiance basé sur la pertinence
4. **Seuil décision** : Minimum 0.7 pour un routage automatique

### 🤖 Actions des Agents

```http
POST /agents/{agent_name}/act
```

**Description** : Exécute une action sur un agent spécifique

**Path Parameters** :
- `agent_name` : `product_builder`, `blablakas_ops`, `kascomodation_ops`, `social_manager`

**Headers** :
```
Content-Type: application/json
Authorization: Bearer {api_key}  # Optionnel en développement
```

**Body** :
```json
{
  "input": "Créer un système de notation pour les conducteurs"
}
```

#### Réponses par Agent

##### Product Builder
```json
{
  "feature_name": "systeme_notation_conducteurs",
  "problem_statement": "Les utilisateurs ont besoin d'évaluer...",
  "scope_in": [
    "Système de notes 1-5 étoiles",
    "Commentaires textuels",
    "Historique des évaluations"
  ],
  "scope_out": [
    "Système de paiement intégré",
    "Géolocalisation temps réel"
  ],
  "user_stories": [
    {
      "role": "utilisateur BlablaKAS",
      "need": "évaluer mon conducteur",
      "goal": "partager mon expérience"
    }
  ],
  "acceptance": [
    {
      "given": "un trajet terminé",
      "when": "l'utilisateur ouvre l'app",
      "then": "une invitation à évaluer apparaît"
    }
  ],
  "risks": [
    "Manipulation des évaluations",
    "Commentaires inappropriés"
  ],
  "metrics": [
    "Taux de participation >70%",
    "Score moyen satisfaction >4.2/5"
  ],
  "tickets": [
    {
      "title": "Créer le modèle de données",
      "description": "Base de données pour notes et commentaires",
      "labels": ["backend", "database"]
    }
  ]
}
```

##### BlablaKAS Ops
```json
{
  "topic": "notation_conducteurs_support",
  "faqs": [
    {
      "question": "Comment modifier ma note après évaluation ?",
      "answer": "Les notes peuvent être modifiées dans les 24h...",
      "category": "evaluation"
    }
  ],
  "macros": [
    {
      "trigger": "note_contestée",
      "response": "Je comprends votre préoccupation concernant cette évaluation...",
      "escalation_level": 1
    }
  ],
  "runbook": [
    {
      "scenario": "Note injuste signalée",
      "steps": [
        "Vérifier l'historique du trajet",
        "Contacter les deux parties",
        "Analyser les preuves disponibles"
      ],
      "sla": "24h"
    }
  ],
  "escalation": [
    {
      "level": 3,
      "trigger": "Contestation note avec menaces",
      "action": "Suspension temporaire + investigation",
      "notify": ["support-lead@blablakas.com"]
    }
  ]
}
```

##### KAScomodation Ops
```json
{
  "booking_recommendations": [
    {
      "location": "Berlin",
      "dates": "2025-09-15 to 2025-09-18",
      "guests": 25,
      "accommodations": [
        {
          "host": "Klaus M.",
          "capacity": 8,
          "price_per_night": 45,
          "rating": 4.8,
          "amenities": ["WiFi", "Kitchen", "Parking"]
        }
      ]
    }
  ],
  "optimization": {
    "total_cost": 3375,
    "average_rating": 4.6,
    "coverage": "100%"
  },
  "alternatives": [
    {
      "scenario": "Si Klaus M. annule",
      "backup_host": "Maria S.",
      "additional_cost": 120
    }
  ],
  "logistics": [
    {
      "checkin_process": "Code numérique envoyé 24h avant",
      "contact_person": "Sarah K. (+49 xxx xxx)",
      "emergency_backup": "Hotel Partner (last resort)"
    }
  ]
}
```

##### Social Manager
```json
{
  "campaign": "notation_conducteurs_launch",
  "posts": [
    {
      "platform": "x",
      "text": "🌟 Nouvelle fonctionnalité BlablaKAS : Notez vos conducteurs ! Plus de transparence et de confiance dans notre communauté. #BlablaKAS #CommunauteKaspa",
      "media_urls": ["https://cdn.kaspa.com/rating-feature.jpg"],
      "hashtags": ["#BlablaKAS", "#Kaspa", "#CovoiturageDecentralise"],
      "scheduled_at": "2025-08-20T10:00:00Z",
      "requires_approval": false
    },
    {
      "platform": "linkedin",
      "text": "BlablaKAS introduit un système de notation communautaire révolutionnaire. Cette fonctionnalité renforce la confiance et améliore l'expérience utilisateur dans l'écosystème Kaspa.",
      "media_urls": [],
      "scheduled_at": "2025-08-20T14:00:00Z",
      "requires_approval": true
    }
  ],
  "reports": [
    {
      "period": "7d",
      "kpis": ["impressions", "engagement", "ctr"],
      "target_impressions": 50000,
      "target_engagement": 0.05
    }
  ],
  "budget": {
    "total": 500,
    "breakdown": {
      "x_ads": 300,
      "linkedin_ads": 200
    }
  }
}
```

### 🔄 Workflows Automatisés

```http
POST /workflow/feature_launch
```

**Description** : Lance un workflow complet de développement de fonctionnalité

**Body** :
```json
{
  "idea": "Système de géolocalisation temps réel pour BlablaKAS"
}
```

**Response** :
```json
{
  "workflow_id": "wf_geo_realtime_001",
  "status": "completed",
  "execution_time": 45.2,
  "results": {
    "product_spec": {
      "feature_name": "geolocalisation_temps_reel",
      "user_stories": [...],
      "tickets": [...]
    },
    "ops_package": {
      "topic": "geolocalisation_support",
      "faqs": [...],
      "runbook": [...]
    },
    "social_plan": {
      "campaign": "geo_feature_launch",
      "posts": [...]
    }
  },
  "jira_tickets_created": [
    "BLABLA-456: Intégration API géolocalisation",
    "BLABLA-457: Interface utilisateur tracking"
  ],
  "next_steps": [
    "Review product spec avec l'équipe",
    "Approval campagne marketing",
    "Planification sprint développement"
  ]
}
```

### 📊 Métriques et Monitoring

```http
GET /metrics
```

**Description** : Statistiques d'utilisation de l'API

**Response** :
```json
{
  "period": "24h",
  "requests": {
    "total": 1247,
    "by_endpoint": {
      "/route": 456,
      "/agents/product_builder/act": 234,
      "/agents/social_manager/act": 189
    }
  },
  "performance": {
    "avg_response_time": 1.34,
    "p95_response_time": 3.21,
    "error_rate": 0.02
  },
  "ai_usage": {
    "openai_tokens": 234567,
    "cost_usd": 12.45,
    "most_active_agent": "social_manager"
  }
}
```

## Endpoints Vercel Functions (Node.js)

### 🏠 Point d'entrée principal

```http
GET /api
```

**Response** :
```json
{
  "message": "🚀 Kaspa Community Tool API",
  "version": "0.4.0",
  "status": "operational",
  "platform": "vercel",
  "runtime": "node.js",
  "services": ["BlablaKAS", "KAScomodation"],
  "endpoints": {
    "health": "/api/health",
    "social": "/api/social",
    "route": "/api/route"
  }
}
```

### 💚 Health Check

```http
GET /api/health
```

**Description** : Vérification de l'état du service

**Response** :
```json
{
  "status": "healthy",
  "service": "kaspa-community-tool",
  "platform": "vercel",
  "runtime": "node.js",
  "timestamp": "2025-08-17T10:30:45.123Z",
  "version": "0.4.0",
  "uptime": "operational",
  "dependencies": {
    "openai_api": "reachable",
    "github_api": "reachable"
  }
}
```

### 📱 Social Media

```http
GET /api/social
```

**Description** : Génération de contenu social media automatisé

**Response** :
```json
{
  "campaign": "kaspa_community_showcase",
  "posts": [
    {
      "platform": "x",
      "text": "🚀 BlablaKAS révolutionne le covoiturage avec la blockchain #Kaspa ! Sécurité, transparence et communauté au cœur de chaque trajet.",
      "media_urls": [],
      "hashtags": ["#BlablaKAS", "#KaspaCommunity", "#Web3"],
      "scheduled_at": "2025-08-17T14:30:00Z",
      "requires_approval": false,
      "estimated_reach": 2500,
      "target_audience": "kaspa_community"
    },
    {
      "platform": "linkedin",
      "text": "KAScomodation transforme l'hébergement collaboratif grâce à la technologie Kaspa. Une nouvelle approche de l'économie du partage, basée sur la confiance et la décentralisation.",
      "media_urls": [],
      "scheduled_at": "2025-08-17T18:30:00Z",
      "requires_approval": false,
      "professional_tone": true,
      "target_industries": ["blockchain", "fintech", "hospitality"]
    }
  ],
  "reports": [
    {
      "period": "7d",
      "kpis": ["impressions", "engagement", "ctr"],
      "platforms": ["x", "linkedin"]
    },
    {
      "period": "30d",
      "kpis": ["impressions", "engagement", "subs"],
      "growth_metrics": true
    }
  ],
  "next_campaign": {
    "theme": "kascomodation_berlin_summit",
    "launch_date": "2025-08-25T09:00:00Z"
  }
}
```

## Codes d'Erreur

### Erreurs Communes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `validation_error` | 422 | Format de requête invalide | Vérifier le schéma JSON |
| `agent_not_found` | 404 | Agent inexistant | Utiliser un nom d'agent valide |
| `llm_error` | 500 | Erreur OpenAI API | Vérifier la clé API et les quotas |
| `rate_limited` | 429 | Trop de requêtes | Attendre avant de réessayer |
| `timeout` | 408 | Délai d'attente dépassé | Réduire la complexité de la requête |

### Exemples d'Erreurs

```json
{
  "error": "validation_error",
  "reason": "Field 'input' is required",
  "details": {
    "field": "input",
    "expected_type": "string",
    "received": null
  },
  "timestamp": "2025-08-17T10:30:45Z"
}
```

```json
{
  "error": "llm_error",
  "reason": "OpenAI API quota exceeded",
  "details": {
    "provider": "openai",
    "error_type": "quota_exceeded",
    "retry_after": 3600
  },
  "timestamp": "2025-08-17T10:30:45Z"
}
```

## Authentication et Sécurité

### API Keys (Production)

```http
Authorization: Bearer kct_prod_abc123def456...
```

**Création d'API Key** :
```bash
curl -X POST https://kaspa-community-tool.vercel.app/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon App Mobile",
    "permissions": ["read", "write"],
    "expires_at": "2025-12-31T23:59:59Z"
  }'
```

### Rate Limiting

| Plan | Requêtes/minute | Requêtes/jour | Burst |
|------|----------------|----------------|-------|
| Free | 60 | 1,000 | 10 |
| Pro | 300 | 10,000 | 50 |
| Enterprise | 1,000 | 100,000 | 100 |

### CORS Configuration

```javascript
// Origines autorisées
const allowedOrigins = [
  'https://app.kaspa-community.com',
  'https://mobile.blablakas.com',
  'http://localhost:3000', // Développement
  'http://localhost:8080'  // Tests
];
```

## SDKs et Libraries

### JavaScript/TypeScript SDK

```bash
npm install @kaspa/community-tool-sdk
```

```typescript
import { KaspaCommunityTool } from '@kaspa/community-tool-sdk';

const kct = new KaspaCommunityTool({
  apiKey: 'your-api-key',
  environment: 'production' // ou 'development'
});

// Routage intelligent
const route = await kct.route('Comment annuler ma réservation ?');
console.log(route.agent); // 'blablakas_ops'

// Action d'agent
const response = await kct.agents.productBuilder.act(
  'Créer un système de paiement crypto'
);

// Workflow complet
const workflow = await kct.workflows.featureLaunch(
  'Intégration wallet Kaspa'
);
```

### Python SDK

```bash
pip install kaspa-community-tool-sdk
```

```python
from kaspa_community_tool import KaspaCommunityTool

kct = KaspaCommunityTool(
    api_key="your-api-key",
    base_url="https://kaspa-community-tool.vercel.app"
)

# Routage
route = kct.route("Créer une FAQ pour KAScomodation")
print(route.agent)  # 'kascomodation_ops'

# Agent action
response = kct.agents.social_manager.act(
    "Créer une campagne pour le Kaspa Summit"
)

# Workflow
workflow = kct.workflows.feature_launch(
    "Système de réservation automatique"
)
```

### cURL Examples

```bash
# Routage intelligent
curl -X POST https://kaspa-community-tool.vercel.app/route \
  -H "Content-Type: application/json" \
  -d '{"text": "Comment créer un runbook pour les incidents ?"}'

# Action d'agent
curl -X POST https://kaspa-community-tool.vercel.app/agents/blablakas_ops/act \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{"input": "Créer une FAQ sur les annulations"}'

# Health check
curl https://kaspa-community-tool.vercel.app/api/health
```

## WebHooks et Événements

### Configuration WebHook

```http
POST /api/webhooks
```

```json
{
  "url": "https://your-app.com/kaspa-webhook",
  "events": ["agent.completed", "workflow.finished"],
  "secret": "webhook-secret-key"
}
```

### Événements Disponibles

| Événement | Description | Payload |
|-----------|-------------|---------|
| `agent.completed` | Agent a terminé une action | `{agent, input, output, duration}` |
| `workflow.finished` | Workflow terminé | `{workflow_id, status, results}` |
| `social.posted` | Post publié sur réseau social | `{platform, post_id, engagement}` |
| `error.occurred` | Erreur système | `{error_type, message, context}` |

## Limites et Quotas

### Limites Techniques

| Ressource | Limite | Description |
|-----------|--------|-------------|
| Input text | 50KB | Taille maximale du texte d'entrée |
| Response size | 1MB | Taille maximale de la réponse |
| Request timeout | 30s | Délai d'attente par requête |
| Concurrent requests | 10 | Requêtes simultanées par clé API |

### Quotas OpenAI

| Agent | Tokens/requête | Coût estimé |
|-------|----------------|-------------|
| Product Builder | 2,000-5,000 | $0.01-$0.025 |
| BlablaKAS Ops | 1,500-3,000 | $0.008-$0.015 |
| KAScomodation Ops | 1,800-3,500 | $0.009-$0.018 |
| Social Manager | 1,200-2,500 | $0.006-$0.013 |

## Testing et Validation

### Environment de Test

```
Base URL: https://staging.kaspa-community-tool.vercel.app
API Key: kct_test_xyz789...
```

### Postman Collection

```json
{
  "info": {
    "name": "Kaspa Community Tool API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Route Intelligence",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\"text\": \"Comment annuler une réservation BlablaKAS ?\"}"
        },
        "url": "{{baseUrl}}/route"
      }
    }
  ]
}
```

### Tests Automatisés

```javascript
// Jest test example
describe('Kaspa Community Tool API', () => {
  test('should route BlablaKAS question correctly', async () => {
    const response = await request(app)
      .post('/route')
      .send({ text: 'Comment annuler ma réservation BlablaKAS ?' });
    
    expect(response.status).toBe(200);
    expect(response.body.agent).toBe('blablakas_ops');
    expect(response.body.confidence).toBeGreaterThan(0.8);
  });
});
```

---

**Dernière mise à jour** : 17 août 2025  
**Version API** : v0.4.0  
**Support** : api-support@kaspa-community.com