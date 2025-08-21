# 🚀 Kaspa Community Tool

> **Plateforme IA Multi-Agents pour l'Écosystème Kaspa**  
> Développez, gérez et faites grandir vos services communautaires avec l'intelligence artificielle

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/ErwanHenry/kaspa-community-tool/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.112.2-teal.svg)](https://fastapi.tiangolo.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange.svg)](https://openai.com)

## ✨ Fonctionnalités

- 🤖 **4 Agents IA spécialisés** avec OpenAI GPT
- 🚗 **BlablaKAS Ops** - Support covoiturage
- 🏠 **KAScomodation Ops** - Gestion hébergement  
- 📱 **Social Manager** - Contenu réseaux sociaux
- 🛠️ **Product Builder** - Spécifications produit
- 📚 **Système RAG** - Récupération de documents
- ⏰ **Scheduler automatique** - Publication programmée
- 🔗 **Intégrations** - Jira, Twitter/X, LinkedIn

## 🚀 Démarrage Rapide

### Installation locale

```bash
# Cloner le projet
git clone <repository-url>
cd kaspa-community-tool

# Environnement virtuel
python3 -m venv .venv
source .venv/bin/activate

# Dépendances
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Éditer .env avec votre clé OpenAI

# Lancer l'application
uvicorn main:app --reload --port 8000
```

### Accès

- **API** : http://localhost:8000
- **Documentation** : http://localhost:8000/docs
- **Interface Swagger** : http://localhost:8000/docs

## 📡 API Usage

### Routage intelligent
```bash
curl -X POST "http://localhost:8000/route" \
  -H "Content-Type: application/json" \
  -d '{"text": "Créer une FAQ BlablaKAS"}'
```

### Agents spécialisés
```bash
# BlablaKAS Support
curl -X POST "http://localhost:8000/agents/blablakas_ops/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Procédure annulation trajet"}'

# KAScomodation Planning  
curl -X POST "http://localhost:8000/agents/kascomodation_ops/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Réservation 3 nuits Berlin"}'

# Social Media
curl -X POST "http://localhost:8000/agents/social_manager/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Campagne lancement fonctionnalité"}'

# Product Specs
curl -X POST "http://localhost:8000/agents/product_builder/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Chat temps réel BlablaKAS"}'
```

### Workflow complet
```bash
curl -X POST "http://localhost:8000/workflow/feature_launch" \
  -H "Content-Type: application/json" \
  -d '{"idea": "Système de notation communautaire"}'
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# OpenAI (Requis)
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Réseaux sociaux (Optionnel)
X_BEARER_TOKEN=your_twitter_token
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Jira (Optionnel)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your_jira_token

# Application
DRY_RUN=true  # false en production
```

## 🏗️ Architecture

```
Frontend/API → Router → Agent → OpenAI + RAG → Response
                  ↓
              External Tools (Jira, Social Media)
                  ↓  
              Scheduler (SQLite + APScheduler)
```

## 📚 Documentation Complète

| Document | Description | Lien |
|----------|-------------|------|
| 📋 **Architecture & Overview** | Vue d'ensemble, installation, structure projet | [docs/README.md](docs/README.md) |
| 🔌 **API Documentation** | Endpoints, authentification, exemples complets | [docs/API.md](docs/API.md) |
| 🚀 **Deployment Guide** | Local, staging, production (Vercel, AWS, Docker) | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| 🤖 **Agents Documentation** | Guide détaillé des 4 agents et leurs capacités | [docs/AGENTS.md](docs/AGENTS.md) |
| 👥 **User Guide** | Guide utilisateur avec cas d'usage concrets | [docs/USER_GUIDE.md](docs/USER_GUIDE.md) |

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Configurer les variables d'environnement sur vercel.com
```

### Docker

```bash
docker build -t kaspa-community-tool .
docker run -p 8000:8000 --env-file .env kaspa-community-tool
```

## 🛠️ Développement

### Structure du projet

```
├── agents.py           # 4 agents IA spécialisés
├── router.py           # Routage intelligent
├── main.py             # API FastAPI
├── openai_llm.py       # Intégration OpenAI
├── rag.py              # Système de récupération
├── schemas.py          # Modèles Pydantic
├── tools.py            # Outils externes
├── workflows.py        # Orchestration multi-agents
├── adapters/           # Intégrations (Jira, Social)
├── scheduler/          # Système de programmation
├── rag/               # Documents de référence
└── config/            # Configuration Jira
```

### Ajout d'agents

1. Définir le prompt dans `prompts.py`
2. Créer le schéma dans `schemas.py`
3. Ajouter au mapping dans `agents.py`
4. Mettre à jour le router dans `router.py`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier `LICENSE` pour les détails.

## 🆘 Support

- 📖 Documentation : `DETAILED_GUIDELINES.md`
- 🐛 Issues : GitHub Issues
- 💬 Community : Kaspa Discord

---

**Fait avec ❤️ pour la communauté Kaspa** 🚀