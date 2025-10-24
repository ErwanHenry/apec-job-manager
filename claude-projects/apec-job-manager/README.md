# APEC Job Manager

Outil d'automatisation pour la gestion d'annonces d'emploi sur APEC.FR (rubrique entreprise).

## Fonctionnalités

### Automatisation APEC
- **Connexion automatique** à votre compte entreprise APEC
- **Création d'annonces** - Publication automatisée de nouvelles offres d'emploi
- **Mise à jour d'annonces** - Modification des annonces existantes
- **Suppression d'annonces** - Retrait automatique des offres expirées
- **Synchronisation** - Sync bidirectionnel entre APEC et votre base de données

### Dashboard de gestion
- **Vue d'ensemble** - Statistiques globales et métriques clés
- **Gestion des annonces** - Liste complète avec filtres et recherche
- **Analytics** - Suivi des vues, candidatures et taux de conversion
- **Interface intuitive** - Design moderne avec Tailwind CSS

### Système de reporting
- **Rapports automatiques** - Quotidiens, hebdomadaires, mensuels
- **Exports multiformats** - PDF, CSV, JSON
- **Métriques avancées** - Performance des annonces, tendances
- **Envoi par email** - Rapports automatiques programmables

## Architecture technique

```
apec-job-manager/
├── src/                          # Backend Node.js/Express
│   ├── server.js                 # Point d'entrée principal
│   ├── services/
│   │   ├── apecService.js        # Automatisation Puppeteer
│   │   ├── reportService.js      # Génération de rapports
│   │   └── cronScheduler.js      # Tâches programmées
│   ├── controllers/              # Logique métier
│   ├── routes/                   # Routes API REST
│   ├── utils/                    # Utilitaires (logger, errors)
│   └── config/                   # Configuration
├── dashboard/                    # Frontend React
│   ├── src/
│   │   ├── pages/                # Pages principales
│   │   ├── components/           # Composants réutilisables
│   │   └── hooks/                # Custom hooks
│   └── public/                   # Assets statiques
├── prisma/                       # Schéma base de données
│   └── schema.prisma
└── docs/                         # Documentation
```

## Stack technologique

### Backend
- **Node.js 18+** avec Express.js
- **Puppeteer** pour l'automatisation web
- **PostgreSQL** via Prisma ORM
- **JWT** pour l'authentification
- **Winston** pour le logging
- **Node-cron** pour les tâches planifiées

### Frontend (Dashboard)
- **React 18** avec Vite
- **React Router** pour la navigation
- **Tailwind CSS** pour le design
- **Recharts** pour les graphiques
- **Heroicons** pour les icônes
- **Axios** pour les appels API

### Base de données
- **PostgreSQL** (production)
- **Prisma** ORM avec migrations
- Schéma complet: Jobs, SyncHistory, Reports, AuditLog

## Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn
- Compte APEC entreprise

### Configuration

1. **Cloner et installer les dépendances**
```bash
cd apec-job-manager
npm install
cd dashboard && npm install
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
```

Éditez `.env` avec vos identifiants APEC:
```env
APEC_EMAIL=votre.email@entreprise.fr
APEC_PASSWORD=votre_mot_de_passe
DATABASE_URL=postgresql://user:password@localhost:5432/apec_manager
```

3. **Initialiser la base de données**
```bash
npx prisma migrate dev
npx prisma generate
```

## Utilisation

### Démarrage en développement

**Backend (port 3000):**
```bash
npm run dev
```

**Dashboard (port 3001):**
```bash
npm run dashboard
```

**Tout en un:**
```bash
npm run dev:all
```

### Démarrage en production

```bash
npm start
```

## API REST

### Jobs (Annonces)

**GET** `/api/jobs` - Liste toutes les annonces
```bash
curl http://localhost:3000/api/jobs?limit=50&offset=0
```

**GET** `/api/jobs/:id` - Détails d'une annonce
```bash
curl http://localhost:3000/api/jobs/abc123
```

**POST** `/api/jobs` - Créer une annonce
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Développeur Full Stack",
    "description": "Nous recherchons...",
    "location": "Paris",
    "contractType": "CDI",
    "salary": "45-55K€"
  }'
```

**PUT** `/api/jobs/:id` - Mettre à jour une annonce
```bash
curl -X PUT http://localhost:3000/api/jobs/abc123 \
  -H "Content-Type: application/json" \
  -d '{"title": "Senior Développeur Full Stack"}'
```

**DELETE** `/api/jobs/:id` - Supprimer une annonce
```bash
curl -X DELETE http://localhost:3000/api/jobs/abc123
```

**POST** `/api/jobs/sync` - Synchroniser avec APEC
```bash
curl -X POST http://localhost:3000/api/jobs/sync
```

### Dashboard

**GET** `/api/dashboard/stats` - Statistiques globales
```bash
curl http://localhost:3000/api/dashboard/stats
```

**GET** `/api/dashboard/recent-activity` - Activité récente
```bash
curl http://localhost:3000/api/dashboard/recent-activity
```

**GET** `/api/dashboard/performance` - Top annonces
```bash
curl http://localhost:3000/api/dashboard/performance
```

### Reports

**GET** `/api/reports` - Liste des rapports
```bash
curl http://localhost:3000/api/reports
```

**GET** `/api/reports/daily` - Générer rapport quotidien
```bash
curl http://localhost:3000/api/reports/daily
```

**GET** `/api/reports/weekly` - Générer rapport hebdomadaire
```bash
curl http://localhost:3000/api/reports/weekly
```

**GET** `/api/reports/monthly` - Générer rapport mensuel
```bash
curl http://localhost:3000/api/reports/monthly
```

**GET** `/api/reports/:id/export?format=pdf` - Exporter un rapport
```bash
curl http://localhost:3000/api/reports/abc123/export?format=pdf -o report.pdf
```

## Dashboard

Accédez au dashboard sur **http://localhost:3001**

### Sections disponibles

1. **Tableau de bord**
   - Vue d'ensemble des statistiques
   - Graphique d'évolution sur 30 jours
   - Métriques clés (vues/annonce, candidatures/annonce)

2. **Annonces**
   - Liste complète de vos offres d'emploi
   - Statuts: Publiée, Brouillon, Expirée
   - Bouton de synchronisation manuelle
   - Création de nouvelles annonces

3. **Rapports**
   - Génération de rapports (quotidien/hebdo/mensuel)
   - Historique des rapports générés
   - Export PDF/CSV/JSON

4. **Paramètres**
   - Configuration des identifiants APEC
   - Fréquence de synchronisation automatique
   - Préférences de notification

## Automatisation

### Synchronisation automatique

Par défaut, la synchronisation s'exécute **toutes les 6 heures** via cron:

```javascript
// Modifier dans .env
AUTO_SYNC_ENABLED=true
AUTO_SYNC_CRON=0 */6 * * *  // Toutes les 6h
```

La synchronisation:
1. Récupère toutes les annonces depuis APEC
2. Compare avec la base de données locale
3. Crée les nouvelles annonces trouvées
4. Met à jour les annonces modifiées (vues, candidatures)
5. Marque comme supprimées les annonces absentes
6. Génère un rapport de synchronisation

### Logs

Les logs sont disponibles dans `logs/`:
- `error.log` - Erreurs uniquement
- `combined.log` - Tous les logs

```bash
tail -f logs/combined.log
```

## Déploiement

### 🚀 Déploiement Vercel (Recommandé)

**Option 1: One-Click Deploy**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager)

**Option 2: Script Automatisé**

```bash
# Setup complet en une commande (15 minutes)
./scripts/setup-vercel.sh
```

Ce script configure automatiquement:
- ✅ Vercel CLI et authentification
- ✅ Vercel Postgres database
- ✅ Vercel KV (Redis cache)
- ✅ Vercel Blob storage
- ✅ Variables d'environnement
- ✅ Prisma migrations
- ✅ Premier déploiement

**Option 3: Manuel via CLI**

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Documentation complète:**
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Guide rapide (10 min)
- **[README_DEPLOY.md](./README_DEPLOY.md)** - Guide complet (900+ lignes)
- **[DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md)** - Rapport technique

**CI/CD GitHub Actions:**

Le projet inclut une pipeline complète:
1. Lint + Tests automatiques
2. Build + Security audit
3. Deploy Preview (pour PRs)
4. Deploy Production (sur main branch)
5. Smoke tests post-déploiement

Configurer les secrets GitHub:
```bash
./scripts/setup-github-secrets.sh
```

**Services Vercel inclus:**
- **Postgres** - Base de données principale (Prisma)
- **KV (Redis)** - Cache et rate limiting
- **Blob Storage** - Exports de rapports (PDF/CSV)
- **Cron Jobs** - 3 tâches automatiques:
  - Sync APEC toutes les 6h
  - Rapport quotidien à 8h00
  - Nettoyage DB à 2h00

### Docker

```bash
# Build l'image
npm run docker:build

# Lancer avec docker-compose
npm run docker:run

# Arrêter
npm run docker:stop
```

### Production Node.js (Self-hosted)

```bash
# Backend
NODE_ENV=production npm start

# Dashboard (build statique)
cd dashboard
npm run build
# Servir avec nginx ou autre
```

## Tests

```bash
# Backend
npm test

# Coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## Sécurité

- **Rate limiting** - 100 requêtes / 15 min par IP
- **Helmet.js** - Headers de sécurité HTTP
- **Validation Joi** - Validation des entrées utilisateur
- **Logs d'audit** - Traçabilité de toutes les actions
- **Credentials** - Jamais commitées (`.gitignore`)

## Health check

```bash
curl http://localhost:3000/api/health
```

Réponse:
```json
{
  "status": "OK",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## Troubleshooting

### Erreur d'authentification APEC
- Vérifiez vos identifiants dans `.env`
- Les cookies APEC peuvent expirer, reconnecter manuellement
- Vérifiez que votre compte entreprise est actif

### Synchronisation échoue
- Vérifiez les logs: `tail -f logs/error.log`
- APEC peut avoir changé la structure HTML
- Le selecteur Puppeteer nécessite peut-être un ajustement

### Dashboard ne charge pas
- Vérifiez que le backend tourne sur le port 3000
- Vérifiez le proxy Vite dans `dashboard/vite.config.js`
- Inspectez la console navigateur (F12)

## Contributions

Les contributions sont les bienvenues! Veuillez:
1. Créer une branche feature
2. Commit vos changements
3. Pousser vers la branche
4. Ouvrir une Pull Request

## Licence

MIT

## Support

Pour toute question ou problème:
- Ouvrir une issue sur GitHub
- Email: support@votreentreprise.fr

---

**Développé avec Node.js, React, Puppeteer et beaucoup de ☕**
