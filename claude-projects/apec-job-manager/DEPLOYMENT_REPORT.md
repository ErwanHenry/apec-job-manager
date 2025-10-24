# APEC Job Manager - Rapport de Déploiement Vercel

## Résumé Exécutif

Configuration complète du déploiement one-click sur Vercel pour APEC Job Manager.

**Date**: 2025-10-24
**Statut**: ✅ Prêt pour déploiement
**Durée de setup estimée**: 15-20 minutes

---

## Fichiers Créés

### 1. Configuration Vercel

#### `/vercel.json`
Configuration complète du déploiement Vercel incluant:

- **Builds**: Configuration pour le dashboard React (Vite)
- **Routes**: Routage API et dashboard avec gestion des méthodes HTTP
- **Headers**: Sécurité CORS, XSS Protection, CSP
- **Environment Variables**: Variables d'environnement de production
- **Cron Jobs**: 3 tâches planifiées
  - Sync APEC: toutes les 6 heures (`0 */6 * * *`)
  - Rapport quotidien: 8h00 chaque jour (`0 8 * * *`)
  - Nettoyage DB: 2h00 chaque jour (`0 2 * * *`)
- **Functions Configuration**:
  - Mémoire: 1024MB (API standard), 3008MB (sync/cron)
  - Timeout: 60s (standard), 300s (sync/cron)
- **GitHub Integration**: Auto-deployment activé

**Fonctionnalités clés:**
- Route versioning API
- Protection CSRF
- Rate limiting headers
- Security headers (HSTS, XSS, Frame Options)
- Prisma engine configuration pour Vercel

---

### 2. Variables d'Environnement

#### `/.env.example` (202 lignes)
Template complet avec 11 sections:

1. **Server Configuration**: NODE_ENV, PORT, API_BASE_URL
2. **APEC Credentials**: Email, password, company ID
3. **Database**: Vercel Postgres avec pooling
4. **Vercel Services**: Postgres, KV, Blob (auto-configurées)
5. **Authentication**: JWT, NextAuth secrets
6. **Rate Limiting**: Configuration des limites
7. **Logging**: Winston configuration
8. **Automation**: Cron settings, Puppeteer
9. **Reporting**: SMTP, Slack notifications
10. **Dashboard**: URLs et API endpoints
11. **Monitoring**: Sentry, Vercel Analytics

**Variables critiques:**
- `DATABASE_URL` - Postgres connection
- `JWT_SECRET` - 32+ caractères
- `NEXTAUTH_SECRET` - 32+ caractères
- `CRON_SECRET` - Sécurisation des cron jobs
- `APEC_EMAIL` / `APEC_PASSWORD` - Credentials APEC

---

### 3. Documentation

#### `/README_DEPLOY.md` (900+ lignes)
Guide complet de déploiement avec:

**Sections principales:**
- Prérequis et installation
- 3 méthodes de déploiement (one-click, CLI, GitHub import)
- Configuration Vercel Services (Postgres, KV, Blob)
- Variables d'environnement détaillées
- Configuration des cron jobs
- Troubleshooting (7 problèmes courants)
- Monitoring et analytics
- Checklist post-déploiement

**Scripts d'exemple inclus:**
- Configuration Prisma
- Seed database
- Health checks
- Cron job handlers

#### `/DEPLOY_BUTTON.md`
Documentation du bouton "Deploy to Vercel":
- Badge Vercel cliquable
- URL pré-configurée avec storages
- Instructions post-déploiement
- Configuration des services
- Troubleshooting

#### `/docs/GITHUB_SECRETS_SETUP.md`
Guide complet pour configurer les secrets GitHub:
- 7 secrets requis/optionnels
- Script automatisé `setup-github-secrets.sh`
- Commandes GitHub CLI
- Meilleures pratiques de sécurité
- Rotation des secrets

---

### 4. Scripts d'Automatisation

#### `/scripts/setup-vercel.sh` (500+ lignes)
Script bash interactif pour setup complet:

**14 étapes automatisées:**
1. Vérification des prérequis (Node 18+, npm, git)
2. Installation des dépendances
3. Installation/vérification Vercel CLI
4. Authentification Vercel
5. Liaison du projet Vercel
6. Configuration des variables d'environnement
7. Génération de secrets sécurisés
8. Création Postgres database
9. Création KV store
10. Création Blob storage
11. Pull des variables depuis Vercel
12. Setup Prisma et migrations
13. Tests de build
14. Déploiement production

**Fonctionnalités:**
- Colored output (succès/erreur/warning)
- Checks interactifs utilisateur
- Génération automatique de secrets crypto
- Détection de configuration existante
- Tests de connexion database

#### `/scripts/init-database.sh` (400+ lignes)
Script d'initialisation database:

**7 étapes:**
1. Vérification prérequis Prisma
2. Génération Prisma Client
3. Test de connexion database
4. Exécution des migrations
5. Vérification du schéma
6. Seed optionnel (données de test)
7. Lancement Prisma Studio (optionnel)

**Fonctionnalités:**
- Support dev/prod environments
- Verification des tables créées
- Seed script avec données d'exemple
- Test de connexion avant migration

---

### 5. CI/CD Pipeline

#### `/.github/workflows/vercel-deploy.yml`
Pipeline GitHub Actions complet avec 7 jobs:

**Job 1: Lint & Code Quality**
- ESLint sur tout le code
- Prettier formatting check
- Exécution sur Node 18+

**Job 2: Run Tests**
- Jest avec coverage
- Upload Codecov
- Parallélisation (maxWorkers=2)

**Job 3: Build Application**
- Build root + dashboard
- Prisma client generation
- Upload artifacts
- Dépend de lint + test

**Job 4: Security Audit**
- npm audit (moderate level)
- Snyk vulnerability scan
- Continue on error

**Job 5: Deploy Preview**
- Déploiement pour PRs et branches non-main
- Commentaire automatique sur PR avec URL
- Download des artifacts de build

**Job 6: Deploy Production**
- Déploiement main branch only
- Exécution migrations DB
- Health check post-déploiement
- Status commit GitHub
- Environment protection

**Job 7: Smoke Tests**
- Tests post-déploiement
- Vérification /api/health
- Tests des endpoints API
- Notification Slack

**Variables requises:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- `CODECOV_TOKEN` (optionnel)
- `SNYK_TOKEN` (optionnel)
- `SLACK_WEBHOOK_URL` (optionnel)

---

### 6. API Routes pour Cron Jobs

#### `/api/cron/sync.js`
Synchronisation automatique avec APEC:

**Fonctionnalités:**
- Vérification authorization (CRON_SECRET + Vercel header)
- Enregistrement dans sync_history
- Gestion des erreurs avec rollback
- Logging détaillé
- Support dev/prod

**Métriques trackées:**
- jobsCreated
- jobsUpdated
- jobsDeleted
- jobsUnchanged
- errors[]
- duration

#### `/api/cron/daily-report.js`
Génération et envoi du rapport quotidien:

**Fonctionnalités:**
- Statistiques des dernières 24h
- Email HTML responsive
- Métriques: total jobs, vues, candidatures, conversion rate
- Status dernière sync
- Sauvegarde en database
- Support SMTP (Gmail, etc.)

**Template email:**
- Header branded
- Cards métriques
- Status badges
- Responsive design
- Footer avec date

#### `/api/cron/cleanup.js`
Nettoyage automatique de la database:

**Tâches:**
- Suppression sync history >90 jours
- Suppression reports >180 jours
- Suppression audit logs >365 jours
- Suppression définitive des jobs soft-deleted >30 jours
- Archivage jobs expirés (>60 jours)
- Optimisation database (VACUUM)

**Audit:**
- Log de cleanup dans audit_log
- Summary avec breakdown détaillé
- Durée d'exécution

---

### 7. Health Check Endpoint

#### `/api/health.js`
Endpoint de monitoring complet:

**Checks:**
- Database connectivity (Postgres)
- Cache connectivity (Vercel KV)
- Storage connectivity (Vercel Blob)

**Informations système:**
- Environment (dev/prod)
- Node version
- Platform
- Uptime
- Memory usage
- Vercel region

**Statuts:**
- `healthy` - Tous les services OK
- `degraded` - Certains services KO
- `unhealthy` - Services critiques KO

**HTTP Status Codes:**
- 200 - Healthy
- 503 - Unhealthy/Degraded

---

## Architecture Technique

### Stack Complet

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Axios pour API calls
- Recharts pour analytics
- React Router pour navigation

**Backend:**
- Express.js (serverless functions)
- Prisma ORM
- PostgreSQL (Vercel Postgres)
- Redis (Vercel KV)
- Blob Storage (Vercel Blob)

**Automation:**
- Puppeteer (scraping APEC)
- node-cron (local)
- Vercel Cron (production)
- Nodemailer (emails)

**Monitoring:**
- Vercel Analytics
- Sentry (optionnel)
- Custom health checks
- Slack notifications

**CI/CD:**
- GitHub Actions
- Vercel deployments
- Automated testing
- Security scanning

---

## Workflow de Déploiement

### 1. Initial Setup (One-time)

```bash
# Clone repository
git clone https://github.com/your-username/apec-job-manager.git
cd apec-job-manager

# Run setup script
./scripts/setup-vercel.sh

# Configure GitHub secrets
./scripts/setup-github-secrets.sh
```

**Durée:** 15-20 minutes

### 2. Déploiement Continu

```bash
# Develop
git checkout -b feature/my-feature
# ... make changes ...
npm test
git commit -m "feat: my feature"
git push origin feature/my-feature
```

**Automatic Actions:**
1. GitHub Actions déclenché
2. Lint + Tests exécutés
3. Build créé
4. Security audit
5. **Preview deployment** sur Vercel
6. Commentaire PR avec URL preview

### 3. Production Release

```bash
# Merge to main
git checkout main
git merge feature/my-feature
git push origin main
```

**Automatic Actions:**
1. GitHub Actions déclenché
2. Lint + Tests + Build
3. **Production deployment** sur Vercel
4. Database migrations
5. Health check
6. Smoke tests
7. Slack notification

---

## Services Vercel Configurés

### 1. Vercel Postgres
- **Purpose**: Base de données principale
- **Region**: Paris (cdg1) ou Frankfurt (fra1)
- **Tables**: jobs, sync_history, reports, audit_logs
- **Connection Pooling**: Oui (2-10 connections)
- **SSL**: Requis

### 2. Vercel KV (Redis)
- **Purpose**: Cache API, rate limiting
- **Region**: Paris (cdg1)
- **TTL**: 1 heure par défaut
- **Use cases**:
  - Cache liste des jobs
  - Rate limiting par IP
  - Session storage

### 3. Vercel Blob Storage
- **Purpose**: Stockage fichiers (exports PDF/CSV)
- **Access**: Public/Private
- **Use cases**:
  - Exports de rapports
  - Logs archivés
  - Backups

---

## Cron Jobs Configuration

### Job 1: Auto-Sync
**Endpoint:** `/api/cron/sync`
**Schedule:** `0 */6 * * *` (toutes les 6 heures)
**Function Memory:** 3008 MB
**Max Duration:** 300s

**Actions:**
- Scrape APEC.fr avec Puppeteer
- Synchronise les nouvelles offres
- Met à jour les offres existantes
- Détecte les offres supprimées
- Enregistre dans sync_history

### Job 2: Daily Report
**Endpoint:** `/api/cron/daily-report`
**Schedule:** `0 8 * * *` (8h00 tous les jours)
**Function Memory:** 1024 MB
**Max Duration:** 60s

**Actions:**
- Collecte statistiques 24h
- Génère rapport HTML
- Envoie email
- Sauvegarde en database

### Job 3: Cleanup
**Endpoint:** `/api/cron/cleanup`
**Schedule:** `0 2 * * *` (2h00 tous les jours)
**Function Memory:** 1024 MB
**Max Duration:** 60s

**Actions:**
- Nettoie anciennes données
- Archive jobs expirés
- Optimise database
- Crée audit log

---

## Sécurité

### Authentification
- JWT tokens (32+ caractères)
- NextAuth for session management
- CRON_SECRET pour sécuriser les cron jobs

### Headers de Sécurité
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### Rate Limiting
- 100 requêtes / 15 minutes
- Configurable via KV storage

### Secrets Management
- GitHub Secrets pour CI/CD
- Vercel Environment Variables pour production
- Jamais de credentials dans le code

---

## Monitoring et Observabilité

### Health Checks
- `/api/health` - Status des services
- Check automatique post-déploiement
- Monitoring externe via UptimeRobot

### Logs
- Vercel Dashboard → Deployments → Logs
- Build logs
- Runtime logs
- Function logs

### Analytics
- Vercel Analytics (automatique)
- Custom metrics dans database
- Rapports quotidiens par email

### Error Tracking
- Sentry (optionnel)
- Console.error dans Vercel logs
- Slack notifications pour échecs

---

## Coûts Vercel

### Plan Free
- 100 GB Bandwidth
- 6,000 Function invocations/day
- 100h Function execution
- 1 Cron job/day
- 256 MB Postgres
- 256 MB KV

**Limitations pour APEC Job Manager:**
- Crons limités (besoin de 3)
- Invocations limitées

### Plan Pro ($20/mois) - **Recommandé**
- 1 TB Bandwidth
- 1M Function invocations/month
- 1,000h Function execution
- **Unlimited Cron jobs**
- **Unlimited databases**
- Analytics avancés

**Parfait pour production:**
- 3 cron jobs actifs
- Dashboard + API haute fréquence
- Postgres + KV + Blob

---

## Checklist de Déploiement

### Pré-déploiement
- [ ] Node 18+ installé
- [ ] Compte Vercel créé
- [ ] Repository GitHub configuré
- [ ] Credentials APEC disponibles

### Configuration
- [ ] `vercel.json` configuré
- [ ] `.env.example` rempli
- [ ] Secrets GitHub configurés
- [ ] Vercel CLI installé

### Vercel Services
- [ ] Postgres database créée
- [ ] KV store créé
- [ ] Blob storage créé
- [ ] Variables d'environnement configurées

### Database
- [ ] Prisma Client généré
- [ ] Migrations exécutées
- [ ] Schema vérifié
- [ ] Seed data (optionnel)

### Déploiement
- [ ] Premier déploiement réussi
- [ ] Dashboard accessible
- [ ] API `/api/health` retourne 200
- [ ] Cron jobs actifs

### Tests
- [ ] Sync manuelle fonctionne
- [ ] Rapport quotidien envoyé
- [ ] Emails configurés (optionnel)
- [ ] Monitoring actif

### Post-déploiement
- [ ] Domaine personnalisé (optionnel)
- [ ] SSL actif
- [ ] Logs vérifiés
- [ ] Documentation équipe

---

## Commandes Utiles

### Déploiement
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# View logs
vercel logs --follow
```

### Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Tests
```bash
# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```

### CI/CD
```bash
# View workflow runs
gh run list

# Watch specific run
gh run watch

# View logs
gh run view <run-id> --log
```

---

## Support et Ressources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### Scripts
- `./scripts/setup-vercel.sh` - Setup automatique
- `./scripts/init-database.sh` - Database setup
- `./scripts/setup-github-secrets.sh` - GitHub secrets

### Files
- `README_DEPLOY.md` - Guide complet
- `DEPLOY_BUTTON.md` - One-click deploy
- `GITHUB_SECRETS_SETUP.md` - Configuration secrets

---

## Prochaines Étapes

### Après Déploiement Initial
1. Tester sync APEC manuellement
2. Vérifier réception emails
3. Configurer monitoring externe
4. Ajouter domaine personnalisé
5. Former l'équipe

### Améliorations Futures
- [ ] Authentification multi-utilisateurs
- [ ] Dashboard analytics avancé
- [ ] Export automatique vers S3
- [ ] Integration Slack complète
- [ ] Mobile app (PWA)
- [ ] API publique documentée

---

## Conclusion

✅ **Configuration complète du déploiement Vercel pour APEC Job Manager**

**Fichiers créés:** 12
**Lines of code:** ~3,500
**Setup time:** 15-20 minutes
**Monthly cost:** $20 (Vercel Pro recommandé)

**Production ready:**
- Déploiement automatisé via GitHub Actions
- 3 cron jobs configurés
- Health checks et monitoring
- Security headers
- Database avec migrations
- Cache Redis
- Blob storage
- Email notifications

**Next action:** Exécuter `./scripts/setup-vercel.sh`

---

**Date du rapport:** 2025-10-24
**Version:** 1.0.0
**Auteur:** Claude Code (Deployment Engineer)
