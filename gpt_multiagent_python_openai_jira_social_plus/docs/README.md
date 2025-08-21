# 🚀 Kaspa Community Tool - Documentation Complète

## Vue d'ensemble

Le **Kaspa Community Tool** est une plateforme multi-agents alimentée par l'IA qui facilite les services communautaires liés à la blockchain Kaspa. Elle comprend deux services principaux :

- **BlablaKAS** : Service de covoiturage décentralisé
- **KAScomodation** : Plateforme d'hébergement entre particuliers

## Architecture Technique

### Stack Technologique

#### Backend Principal (Python)
- **FastAPI** : Framework web moderne et performant
- **Pydantic** : Validation de données et sérialisation
- **OpenAI GPT-4** : Moteur d'intelligence artificielle
- **APScheduler** : Planification de tâches automatisées
- **SQLite** : Base de données légère pour le stockage

#### Frontend API (Node.js/TypeScript)
- **Vercel Functions** : Déploiement serverless
- **TypeScript** : Typage statique pour JavaScript
- **Node.js 18+** : Runtime JavaScript moderne

#### Intégrations Externes
- **OpenAI API** : Génération de contenu IA
- **Jira API** : Gestion de tickets et projets
- **Twitter/X API** : Automatisation social media
- **LinkedIn API** : Marketing professionnel

### Architecture Multi-Agents

Le système utilise une architecture basée sur 4 agents spécialisés :

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Product Builder │    │ BlablaKAS Ops   │    │KAScomodation Ops│    │ Social Manager  │
│                 │    │                 │    │                 │    │                 │
│ • Specs tech    │    │ • FAQ           │    │ • Planification │    │ • Campagnes     │
│ • User stories  │    │ • Procédures    │    │ • Réservations  │    │ • Content       │
│ • Architecture  │    │ • Support       │    │ • Hébergement   │    │ • Scheduling    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                    ┌─────────────────────────────────────┐
                    │        Router Intelligent           │
                    │                                     │
                    │ • Classification d'intent          │
                    │ • Routage automatique               │
                    │ • Détection de mots-clés            │
                    └─────────────────────────────────────┘
```

## Installation et Configuration

### Prérequis

- Python 3.9+
- Node.js 18+
- Compte OpenAI avec API Key
- Git

### Installation Locale

```bash
# 1. Cloner le repository
git clone https://github.com/ErwanHenry/kaspa-community-tool.git
cd kaspa-community-tool

# 2. Créer l'environnement virtuel Python
python -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\\Scripts\\activate

# 3. Installer les dépendances Python
pip install -r requirements-local.txt

# 4. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# 5. Démarrer l'application
uvicorn main:app --reload --port 8000
```

### Variables d'Environnement

```bash
# .env
OPENAI_API_KEY=sk-...
JIRA_API_TOKEN=your-jira-token
TWITTER_API_KEY=your-twitter-key
LINKEDIN_API_KEY=your-linkedin-key
ENVIRONMENT=development
```

## Structure du Projet

```
kaspa-community-tool/
├── 📁 api/                    # API Vercel (Node.js/TypeScript)
│   ├── index.js              # Endpoint principal API
│   ├── health.js             # Health check endpoint
│   ├── social.js             # Endpoints social media
│   └── hello.js              # Test endpoint
├── 📁 adapters/               # Intégrations externes
│   ├── jira.py               # Connecteur Jira
│   ├── twitter_x.py          # Connecteur Twitter/X
│   └── linkedin.py           # Connecteur LinkedIn
├── 📁 agents/                 # Système multi-agents
│   ├── agents.py             # Définition des agents
│   ├── prompts.py            # Prompts système pour chaque agent
│   └── schemas.py            # Schémas Pydantic de validation
├── 📁 config/                 # Configuration
│   └── jira_mapping.json     # Mapping des projets Jira
├── 📁 docs/                   # Documentation
│   ├── README.md             # Documentation principale
│   ├── API.md                # Documentation API
│   └── DEPLOYMENT.md         # Guide de déploiement
├── 📁 rag/                    # Base de connaissances RAG
│   ├── blablakas_ops/        # Docs BlablaKAS
│   ├── kascomodation_ops/    # Docs KAScomodation
│   ├── product_builder/      # Guides techniques
│   └── social_manager/       # Brand guidelines
├── 📁 scheduler/              # Système de tâches
│   ├── worker.py             # Worker principal
│   ├── db.py                 # Base de données
│   └── queue.py              # Gestion des queues
├── main.py                   # Application FastAPI principale
├── router.py                 # Routage intelligent des requêtes
├── workflows.py              # Workflows automatisés
├── requirements.txt          # Dépendances Python
├── package.json              # Configuration Node.js
└── vercel.json               # Configuration Vercel
```

## Agents et Fonctionnalités

### 1. Product Builder Agent 🏗️

**Responsabilité** : Architecture et spécifications techniques

**Capacités** :
- Génération de spécifications techniques détaillées
- Création de user stories avec critères d'acceptation
- Architecture système et modèles de données
- Gestion des risques et métriques

**Input** : Description de fonctionnalité ou besoin technique
**Output** : `ProductSpec` avec structure complète

**Exemple d'utilisation** :
```python
POST /agents/product_builder/act
{
  "input": "Créer un système de notation pour les conducteurs BlablaKAS"
}
```

### 2. BlablaKAS Ops Agent 🚗

**Responsabilité** : Opérations et support covoiturage

**Capacités** :
- Génération de FAQ dynamiques
- Création de macros de support client
- Procédures opérationnelles (runbooks)
- Gestion d'escalade des incidents

**Domaines d'expertise** :
- Réservations et annulations
- Sécurité et vérifications
- Paiements et remboursements
- Gestion des litiges

**Exemple d'utilisation** :
```python
POST /agents/blablakas_ops/act
{
  "input": "Comment gérer une annulation de dernière minute ?"
}
```

### 3. KAScomodation Ops Agent 🏠

**Responsabilité** : Gestion hébergements et logistique

**Capacités** :
- Planification d'hébergements
- Gestion des disponibilités
- Optimisation des réservations
- Support aux hôtes et invités

**Fonctionnalités spéciales** :
- Détection de conflits de planning
- Suggestions d'hébergements alternatifs
- Calculs de tarification dynamique

**Exemple d'utilisation** :
```python
POST /agents/kascomodation_ops/act
{
  "input": "Planifier 5 hébergements pour le KAS Summit à Berlin"
}
```

### 4. Social Manager Agent 📱

**Responsabilité** : Marketing et communication digitale

**Capacités** :
- Création de campagnes social media
- Planification de posts automatisés
- Génération de contenu engageant
- Analyse de performance

**Plateformes supportées** :
- Twitter/X
- LinkedIn
- Future : Instagram, TikTok

**Exemple d'utilisation** :
```python
POST /agents/social_manager/act
{
  "input": "Créer une campagne pour promouvoir la nouvelle fonctionnalité de géolocalisation"
}
```

## API Endpoints

### Endpoints Principaux

#### 1. Route Intelligence
```http
POST /route
Content-Type: application/json

{
  "text": "Comment annuler ma réservation BlablaKAS ?"
}

Response:
{
  "agent": "blablakas_ops",
  "confidence": 0.95,
  "reasoning": "Keywords detected: annuler, réservation, BlablaKAS"
}
```

#### 2. Agent Action
```http
POST /agents/{agent_name}/act
Content-Type: application/json

{
  "input": "Créer une FAQ sur les remboursements"
}

Response:
{
  "topic": "remboursements_blablakas",
  "faqs": [...],
  "macros": [...],
  "runbook": [...],
  "escalation": [...]
}
```

#### 3. Workflow Feature Launch
```http
POST /workflow/feature_launch
Content-Type: application/json

{
  "idea": "Système de notation communautaire"
}

Response:
{
  "product_spec": {...},
  "ops_package": {...},
  "social_plan": {...}
}
```

### Endpoints Vercel (Node.js)

#### 1. Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "service": "kaspa-community-tool",
  "platform": "vercel",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

#### 2. Social Media
```http
GET /api/social

Response:
{
  "campaign": "kaspa_community_showcase",
  "posts": [
    {
      "platform": "x",
      "text": "🚀 BlablaKAS révolutionne le covoiturage...",
      "scheduled_at": "2025-08-17T12:30:00Z"
    }
  ]
}
```

## Système RAG (Retrieval-Augmented Generation)

### Structure de la Base de Connaissances

Le système RAG enrichit les réponses des agents avec des connaissances spécifiques :

```
rag/
├── blablakas_ops/
│   ├── policies.md           # Politiques de covoiturage
│   ├── safety_guidelines.md  # Guide de sécurité
│   └── pricing_model.md      # Modèle de tarification
├── kascomodation_ops/
│   ├── playbook.md          # Guide opérationnel
│   ├── host_guidelines.md   # Guide pour les hôtes
│   └── booking_process.md   # Processus de réservation
├── product_builder/
│   ├── style.md             # Guide de style technique
│   ├── architecture.md      # Principes d'architecture
│   └── testing_standards.md # Standards de test
└── social_manager/
    ├── brand.md             # Guidelines de marque
    ├── content_calendar.md  # Calendrier de contenu
    └── engagement_rules.md  # Règles d'engagement
```

### Algorithme de Récupération

Le système utilise TF-IDF pour la recherche sémantique :

1. **Indexation** : Vectorisation des documents avec TF-IDF
2. **Requête** : Analyse de la requête utilisateur
3. **Récupération** : Top-K documents les plus pertinents
4. **Augmentation** : Injection dans le prompt de l'agent

## Déploiement

### Déploiement Local

```bash
# Démarrage en mode développement
uvicorn main:app --reload --port 8000

# Accès à la documentation interactive
http://localhost:8000/docs
```

### Déploiement Vercel

```bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel --prod

# Configuration des variables d'environnement
vercel env add OPENAI_API_KEY
```

### Docker (Optionnel)

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Configuration Avancée

### Personnalisation des Agents

Les agents peuvent être personnalisés via les prompts dans `prompts.py` :

```python
CUSTOM_AGENT_PROMPT = '''
Tu es un expert en blockchain Kaspa.
Ton rôle est de [ROLE_DESCRIPTION].
Tu dois toujours [BEHAVIORAL_GUIDELINES].

Format de réponse attendu :
{
  "field1": "description",
  "field2": ["item1", "item2"]
}
'''
```

### Intégration Jira

Configuration dans `config/jira_mapping.json` :

```json
{
  "projects": {
    "BLABLA": {
      "name": "BlablaKAS Development",
      "default_assignee": "dev-team@kaspa.com"
    },
    "KASCOM": {
      "name": "KAScomodation Platform", 
      "default_assignee": "platform-team@kaspa.com"
    }
  }
}
```

### Scheduler Configuration

Le système de tâches automatisées peut être configuré :

```python
# scheduler/worker.py
scheduler.add_job(
    func=social_posting_job,
    trigger="interval",
    minutes=30,
    id='social_posting',
    name='Automated Social Media Posting'
)
```

## Monitoring et Observabilité

### Métriques Clés

- **Latence des agents** : Temps de réponse moyen
- **Taux d'erreur** : Pourcentage d'erreurs par agent
- **Utilisation API** : Consommation OpenAI tokens
- **Throughput** : Requêtes par seconde

### Logging

Les logs sont structurés pour faciliter le debugging :

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
logger.info("Agent response generated", extra={
    "agent": agent_name,
    "input_length": len(user_input),
    "response_time": response_time
})
```

## Sécurité

### Bonnes Pratiques Implémentées

1. **Validation d'entrée** : Pydantic pour tous les inputs
2. **Rate limiting** : Protection contre les abus
3. **API Key rotation** : Gestion sécurisée des clés
4. **CORS configuré** : Restriction des origines autorisées

### Variables Sensibles

Toutes les clés API sont stockées en variables d'environnement :

```bash
# Ne jamais committer ces valeurs !
OPENAI_API_KEY=sk-proj-...
JIRA_API_TOKEN=ATATT3x...
TWITTER_BEARER_TOKEN=AAAA...
```

## Performance et Optimisation

### Optimisations Implémentées

1. **Cache RAG** : Mise en cache des embeddings
2. **Connection pooling** : Réutilisation des connexions HTTP
3. **Validation asynchrone** : Traitement parallèle
4. **Compression responses** : Réduction de la bande passante

### Recommandations Scaling

- **Horizontal scaling** : Plusieurs instances FastAPI
- **Database upgrade** : Migration vers PostgreSQL
- **CDN integration** : Cache des assets statiques
- **Load balancing** : Répartition de charge

## Troubleshooting

### Problèmes Courants

#### 1. Erreur OpenAI API
```
Error: openai.BadRequestError: Invalid API key
```
**Solution** : Vérifier la variable `OPENAI_API_KEY`

#### 2. Agent Validation Error
```
Error: validation_error for ProductSpec
```
**Solution** : Vérifier le format de sortie dans le prompt

#### 3. Vercel 404 Errors
```
The page could not be found - NOT_FOUND
```
**Solution** : Vérifier la structure des fichiers `/api`

### Debug Mode

```bash
# Activation du mode debug
export DEBUG=true
uvicorn main:app --reload --log-level debug
```

## Contribution

### Workflow de Développement

1. **Fork** le repository
2. **Branch** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Develop** : Implémentation avec tests
4. **Test** : `python -m pytest tests/`
5. **Submit** : Pull Request avec description

### Standards de Code

- **Python** : PEP 8, type hints obligatoires
- **TypeScript** : ESLint + Prettier
- **Tests** : Couverture > 80%
- **Documentation** : Docstrings pour toutes les fonctions

## Roadmap et Évolutions

### Version 1.0 (Q4 2025)
- [ ] Interface web complète
- [ ] Mobile app (React Native)
- [ ] Intégration blockchain Kaspa
- [ ] Système de paiement crypto

### Version 1.1 (Q1 2026)
- [ ] IA prédictive pour les recommandations
- [ ] Marketplace de services communautaires
- [ ] Système de réputation avancé
- [ ] Multi-language support

### Intégrations Futures
- [ ] Telegram bot
- [ ] Discord integration
- [ ] WhatsApp Business API
- [ ] Apple/Google Pay

## Support et Contact

### Communauté
- **GitHub Issues** : [Signaler un bug](https://github.com/ErwanHenry/kaspa-community-tool/issues)
- **Discord Kaspa** : Canal #community-tools
- **Documentation** : https://docs.kaspa-community-tool.com

### Équipe de Développement
- **Lead Developer** : [@ErwanHenry](https://github.com/ErwanHenry)
- **Community Manager** : Kaspa Community Team

---

**Version de la documentation** : 1.0  
**Dernière mise à jour** : 17 août 2025  
**Licence** : MIT License

---

*Cette documentation est maintenue par la communauté Kaspa. N'hésitez pas à contribuer en soumettant des pull requests !*