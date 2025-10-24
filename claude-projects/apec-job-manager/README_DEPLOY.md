# APEC Job Manager - Guide de Déploiement Vercel

## Table des matières

- [Prérequis](#prérequis)
- [Déploiement One-Click](#déploiement-one-click)
- [Configuration Manuelle](#configuration-manuelle)
- [Services Vercel](#services-vercel)
- [Variables d'Environnement](#variables-denvironnement)
- [Cron Jobs](#cron-jobs)
- [Troubleshooting](#troubleshooting)
- [Monitoring](#monitoring)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir:

- Un compte [Vercel](https://vercel.com) (gratuit ou Pro)
- Un compte [GitHub](https://github.com) avec le repository du projet
- Accès aux credentials APEC (email et mot de passe)
- Node.js 18+ installé localement pour les tests

---

## Déploiement One-Click

### Méthode 1: Deploy Button

Cliquez sur le bouton ci-dessous pour déployer en un clic:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager&env=APEC_EMAIL,APEC_PASSWORD,APEC_COMPANY_ID,JWT_SECRET,NEXTAUTH_SECRET&envDescription=Environment%20variables%20required%20for%20APEC%20Job%20Manager&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager%2Fblob%2Fmain%2F.env.example&project-name=apec-job-manager&repository-name=apec-job-manager&stores=[{"type":"postgres"},{"type":"kv"},{"type":"blob"}])

### Méthode 2: Vercel CLI

```bash
# Installer Vercel CLI globalement
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer depuis le répertoire du projet
cd /Users/erwanhenry/claude-projects/apec-job-manager
vercel

# Suivre les instructions interactives
# - Link to existing project? No
# - Project name: apec-job-manager
# - Directory: ./
# - Override settings? No
```

### Méthode 3: Import GitHub

1. Connectez-vous à [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Sélectionnez **"Import Git Repository"**
4. Choisissez votre repository GitHub
5. Configurez les paramètres:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build && cd dashboard && npm run build`
   - **Output Directory**: dashboard/dist
   - **Install Command**: `npm install && cd dashboard && npm install`
6. Cliquez sur **"Deploy"**

---

## Configuration Manuelle

### Étape 1: Fork et Clone du Repository

```bash
# Fork le repository sur GitHub (via l'interface web)

# Clone votre fork
git clone https://github.com/your-username/apec-job-manager.git
cd apec-job-manager

# Installer les dépendances
npm install
cd dashboard && npm install && cd ..
```

### Étape 2: Configuration Locale

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env  # ou vim, code, etc.
```

### Étape 3: Test Local

```bash
# Démarrer en mode développement
npm run dev:all

# Tester l'API
curl http://localhost:3000/api/health

# Tester le dashboard
open http://localhost:3001
```

---

## Services Vercel

### 1. Vercel Postgres (Base de données)

#### A. Via Vercel Dashboard

1. Allez dans votre projet Vercel
2. Onglet **"Storage"** → **"Create Database"**
3. Sélectionnez **"Postgres"**
4. Choisissez la région **"Frankfurt (fra1)"** ou **"Paris (cdg1)"**
5. Nommez votre base: `apec-job-manager-db`
6. Cliquez sur **"Create"**

Les variables d'environnement suivantes seront automatiquement ajoutées:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

#### B. Via Vercel CLI

```bash
# Créer une base de données Postgres
vercel postgres create apec-job-manager-db --region cdg1

# Lier la base au projet
vercel link
vercel env pull .env.local
```

#### C. Migration Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier la connexion
npx prisma db push
```

### 2. Vercel KV (Redis Cache)

#### A. Via Vercel Dashboard

1. Onglet **"Storage"** → **"Create Database"**
2. Sélectionnez **"KV"**
3. Nommez: `apec-job-manager-kv`
4. Région: **"Paris (cdg1)"**
5. Cliquez sur **"Create"**

Variables ajoutées automatiquement:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`
- `KV_URL`

#### B. Via Vercel CLI

```bash
vercel kv create apec-job-manager-kv --region cdg1
```

#### C. Utilisation dans le code

```javascript
// src/utils/cache.js
import { kv } from '@vercel/kv';

// Mettre en cache
await kv.set('jobs:list', jobsData, { ex: 3600 }); // 1 heure

// Récupérer du cache
const cachedJobs = await kv.get('jobs:list');

// Supprimer du cache
await kv.del('jobs:list');
```

### 3. Vercel Blob Storage (Fichiers)

#### A. Via Vercel Dashboard

1. Onglet **"Storage"** → **"Create Database"**
2. Sélectionnez **"Blob"**
3. Nommez: `apec-job-manager-blob`
4. Cliquez sur **"Create"**

Variable ajoutée:
- `BLOB_READ_WRITE_TOKEN`

#### B. Via Vercel CLI

```bash
vercel blob create apec-job-manager-blob
```

#### C. Utilisation pour les exports

```javascript
// src/utils/storage.js
import { put, list, del } from '@vercel/blob';

// Upload un fichier
const blob = await put('reports/report-2024-01.pdf', file, {
  access: 'public',
  contentType: 'application/pdf',
});

// Lister les fichiers
const blobs = await list({ prefix: 'reports/' });

// Supprimer un fichier
await del(blob.url);
```

---

## Variables d'Environnement

### Configuration via Dashboard

1. Allez dans **"Settings"** → **"Environment Variables"**
2. Ajoutez les variables suivantes:

#### Variables Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `APEC_EMAIL` | Email de connexion APEC | `user@company.com` |
| `APEC_PASSWORD` | Mot de passe APEC | `SecurePass123!` |
| `APEC_COMPANY_ID` | ID de votre entreprise | `12345` |
| `JWT_SECRET` | Secret JWT (32+ caractères) | `crypto.randomBytes(32)` |
| `NEXTAUTH_SECRET` | Secret NextAuth (32+ caractères) | `crypto.randomBytes(32)` |
| `NEXTAUTH_URL` | URL de production | `https://apec-job-manager.vercel.app` |

#### Variables Optionnelles

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `AUTO_SYNC_ENABLED` | Activer la sync automatique | `true` |
| `AUTO_SYNC_CRON` | Fréquence de sync | `0 */6 * * *` |
| `MAX_CONCURRENT_JOBS` | Jobs simultanés max | `5` |
| `TIMEOUT_MS` | Timeout requêtes | `30000` |
| `LOG_LEVEL` | Niveau de logs | `info` |
| `SMTP_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Port SMTP | `587` |
| `SMTP_USER` | Email SMTP | `alerts@company.com` |
| `SMTP_PASSWORD` | App password Gmail | - |

### Configuration via CLI

```bash
# Ajouter une variable
vercel env add APEC_EMAIL production

# Importer depuis .env
vercel env pull

# Lister les variables
vercel env ls
```

### Générer des secrets sécurisés

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cron Jobs

### Configuration des Tâches Planifiées

Les cron jobs sont configurés dans `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Tâches Disponibles

| Endpoint | Fréquence | Description |
|----------|-----------|-------------|
| `/api/cron/sync` | Toutes les 6h | Synchronise les offres avec APEC |
| `/api/cron/daily-report` | 8h00 quotidien | Génère le rapport quotidien |
| `/api/cron/cleanup` | 2h00 quotidien | Nettoie les anciennes données |

### Créer les API routes pour cron

Créez ces fichiers dans `/api/cron/`:

#### /api/cron/sync.js

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Vérifier que c'est un appel cron Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Logique de synchronisation
    const result = await syncWithApec();

    res.status(200).json({
      success: true,
      synced: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron sync error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
```

#### /api/cron/daily-report.js

```javascript
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../src/utils/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Générer le rapport
    const report = await generateDailyReport();

    // Envoyer par email
    await sendEmail({
      to: process.env.REPORT_EMAIL_RECIPIENTS,
      subject: `Rapport APEC - ${new Date().toLocaleDateString()}`,
      html: report.html,
    });

    res.status(200).json({ success: true, sent: true });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
```

#### /api/cron/cleanup.js

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Supprimer les anciennes données (>90 jours)
    const deleted = await prisma.syncHistory.deleteMany({
      where: {
        completedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });

    res.status(200).json({
      success: true,
      deleted: deleted.count
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
```

### Sécuriser les Cron Jobs

1. Générez un secret pour les crons:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. Ajoutez la variable `CRON_SECRET` dans Vercel:

```bash
vercel env add CRON_SECRET production
```

3. Vercel ajoutera automatiquement ce header dans ses requêtes cron.

---

## Troubleshooting

### Problèmes Courants

#### 1. Build Failed

**Erreur**: `Command "npm run build" exited with 1`

**Solutions**:
```bash
# Nettoyer les dépendances
rm -rf node_modules dashboard/node_modules
npm install
cd dashboard && npm install

# Vérifier les scripts package.json
npm run build
cd dashboard && npm run build
```

#### 2. Prisma Error

**Erreur**: `PrismaClient is not configured`

**Solutions**:
```bash
# Ajouter à vercel.json
{
  "env": {
    "PRISMA_QUERY_ENGINE_LIBRARY": "/var/task/node_modules/.prisma/client/libquery_engine-rhel-openssl-1.0.x.so.node"
  }
}

# Régénérer le client
npx prisma generate
```

#### 3. Database Connection Error

**Erreur**: `Can't reach database server`

**Solutions**:
- Vérifiez que `DATABASE_URL` est configurée
- Utilisez `POSTGRES_URL` fournie par Vercel
- Ajoutez `?sslmode=require` à la fin de l'URL
- Vérifiez la région de la base (doit être proche de votre app)

#### 4. Puppeteer Timeout

**Erreur**: `TimeoutError: Navigation timeout exceeded`

**Solutions**:
```bash
# Augmenter le timeout dans vercel.json
{
  "functions": {
    "api/sync.js": {
      "maxDuration": 300
    }
  }
}

# Ou utiliser puppeteer-core avec chromium
npm install puppeteer-core @sparticuz/chromium
```

#### 5. Environment Variables Not Found

**Solutions**:
```bash
# Vérifier les variables
vercel env ls

# Redéployer après modification
vercel --prod

# Pull les variables localement
vercel env pull .env.local
```

#### 6. Cron Jobs Not Running

**Solutions**:
- Vérifiez que vous êtes sur un plan Pro (crons gratuits limités)
- Consultez les logs: Dashboard → Deployments → Logs
- Testez manuellement: `curl https://your-app.vercel.app/api/cron/sync`
- Vérifiez le header `Authorization` dans votre code

#### 7. API Routes 404

**Solutions**:
```bash
# Vérifier la structure des dossiers
api/
  health.js
  stats.js
  jobs/
    index.js
    [id].js
  cron/
    sync.js

# Vérifier vercel.json routes
```

### Logs et Debugging

#### Consulter les logs en temps réel

```bash
# Via CLI
vercel logs --follow

# Logs d'un déploiement spécifique
vercel logs <deployment-url>
```

#### Dashboard Vercel

1. Allez dans **"Deployments"**
2. Cliquez sur un déploiement
3. Onglet **"Logs"** pour voir les logs de build et runtime
4. Filtrer par:
   - Build logs
   - Runtime logs
   - Static logs

#### Ajouter des logs dans le code

```javascript
// Utiliser console.log/error (visible dans Vercel logs)
console.log('Sync started:', { jobCount: jobs.length });
console.error('Sync failed:', error);

// Ou utiliser Winston pour des logs structurés
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

logger.info('Sync completed', { duration: 1234, count: 50 });
```

---

## Monitoring

### Vercel Analytics

Activé automatiquement sur tous les plans Vercel.

**Dashboard**: Vercel → Project → Analytics

**Métriques disponibles**:
- Page views
- Unique visitors
- Top pages
- Devices
- Browsers
- Locations

### Vercel Speed Insights

Pour monitorer les performances:

```bash
npm install @vercel/speed-insights
```

```javascript
// dashboard/src/main.jsx
import { SpeedInsights } from '@vercel/speed-insights/react';

function App() {
  return (
    <>
      <YourApp />
      <SpeedInsights />
    </>
  );
}
```

### Sentry (Error Tracking)

#### Installation

```bash
npm install @sentry/node @sentry/tracing
```

#### Configuration

```javascript
// src/utils/sentry.js
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export default Sentry;
```

#### Utilisation

```javascript
// api/jobs/index.js
import Sentry from '../../src/utils/sentry';

export default async function handler(req, res) {
  try {
    // Votre code
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({ error: error.message });
  }
}
```

### Health Checks

#### API Health Endpoint

```javascript
// api/health.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {}
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }

  try {
    // Check KV cache
    const { kv } = await import('@vercel/kv');
    await kv.ping();
    checks.services.cache = 'healthy';
  } catch (error) {
    checks.services.cache = 'unhealthy';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
}
```

#### Monitoring externe

Services recommandés:
- [UptimeRobot](https://uptimerobot.com) - Gratuit, 50 moniteurs
- [Pingdom](https://www.pingdom.com) - Payant, plus de features
- [Cronitor](https://cronitor.io) - Spécialisé dans les cron jobs

Configuration UptimeRobot:
1. Monitor Type: HTTP(s)
2. URL: `https://your-app.vercel.app/api/health`
3. Interval: 5 minutes
4. Alert Contacts: Email/SMS

---

## Commandes Utiles

### Vercel CLI

```bash
# Déployer en production
vercel --prod

# Déployer en preview
vercel

# Lister les déploiements
vercel ls

# Voir les logs
vercel logs

# Voir les variables d'environnement
vercel env ls

# Pull les variables localement
vercel env pull

# Ouvrir le projet dans le dashboard
vercel open

# Lier un projet existant
vercel link

# Informations sur le projet
vercel inspect
```

### Database

```bash
# Migrations Prisma
npx prisma migrate dev
npx prisma migrate deploy

# Prisma Studio (interface graphique)
npx prisma studio

# Générer le client
npx prisma generate

# Seed la database
npx prisma db seed
```

### Tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Lint
npm run lint

# Fix lint automatiquement
npm run lint:fix
```

---

## Checklist Post-Déploiement

- [ ] Application accessible via l'URL Vercel
- [ ] Dashboard fonctionne (interface React)
- [ ] API `/api/health` retourne 200
- [ ] Database Postgres connectée
- [ ] KV Cache configuré
- [ ] Blob Storage configuré
- [ ] Variables d'environnement toutes configurées
- [ ] Cron jobs actifs (vérifier les logs)
- [ ] APEC sync fonctionne manuellement
- [ ] Emails de rapport fonctionnent
- [ ] Monitoring actif (Vercel Analytics)
- [ ] Logs visibles dans Vercel Dashboard
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] SSL/HTTPS actif
- [ ] Tests de charge effectués
- [ ] Documentation à jour

---

## Support

### Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel Storage](https://vercel.com/docs/storage)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Prisma + Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Contact

- GitHub Issues: [Repository Issues](https://github.com/your-username/apec-job-manager/issues)
- Vercel Support: [support@vercel.com](mailto:support@vercel.com)

---

Dernière mise à jour: 2025-10-24
