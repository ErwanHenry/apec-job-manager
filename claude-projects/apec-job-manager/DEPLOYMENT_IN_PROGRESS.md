# 🚀 Déploiement en cours - APEC Job Manager

## ✅ Ce qui a été fait

### 1. Repository GitHub ✓
- **URL:** https://github.com/ErwanHenry/apec-job-manager
- Code pushé avec succès (120 fichiers, 23,000+ lignes)
- README avec bouton Deploy to Vercel

### 2. Vercel CLI ✓
- Vercel CLI installé (v48.2.0)
- Connecté en tant que: `erwanhenry`

### 3. Premier Déploiement ✓
- Déploiement initié sur Vercel
- **Project:** erwan-henrys-projects/next-app
- **Build en cours:** https://vercel.com/erwan-henrys-projects/next-app
- **URL Preview:** https://next-n1nceu8tz-erwan-henrys-projects.vercel.app

### 4. Secret NextAuth Généré ✓
```
NEXTAUTH_SECRET=4WnSzIjnMN4z7eYR+JWIY3vwPl4SqS7nu6LFs4edPiU=
```

---

## 📋 Prochaines Étapes

### Étape 1: Vérifier le build sur Vercel Dashboard

1. Ouvrir: https://vercel.com/erwan-henrys-projects/next-app
2. Aller dans l'onglet **Deployments**
3. Cliquer sur le dernier déploiement
4. Vérifier si le build:
   - ✅ Est terminé avec succès
   - ❌ A échoué (voir les logs d'erreur)

**Si le build échoue**, c'est probablement à cause de variables d'environnement manquantes.

---

### Étape 2: Configurer les Variables d'Environnement

Aller sur: https://vercel.com/erwan-henrys-projects/next-app/settings/environment-variables

#### Variables Essentielles

```bash
# Authentication
NEXTAUTH_URL=https://next-app-erwan-henrys-projects.vercel.app
NEXTAUTH_SECRET=4WnSzIjnMN4z7eYR+JWIY3vwPl4SqS7nu6LFs4edPiU=

# APEC Credentials
APEC_EMAIL=erwan.henry@spikeelabs.fr
APEC_PASSWORD=AbcWxcvbn1234*

# Cron Secret (générer un nouveau)
CRON_SECRET=<générer avec: openssl rand -base64 32>
```

**Pour toutes les environnements:** Production, Preview, Development

---

### Étape 3: Activer Vercel Storage

#### 3.1 Vercel Postgres

1. Aller sur: https://vercel.com/erwan-henrys-projects/next-app/stores
2. Cliquer **Create Database** → **Postgres**
3. Choisir le plan **Hobby** (gratuit)
4. Cliquer **Create**
5. Les variables seront ajoutées automatiquement:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

#### 3.2 Vercel KV (Redis)

1. Dans la même page **Stores**
2. Cliquer **Create Database** → **KV**
3. Choisir le plan **Hobby** (gratuit)
4. Cliquer **Create**
5. Les variables seront ajoutées automatiquement:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

#### 3.3 Vercel Blob

1. Dans la même page **Stores**
2. Cliquer **Create Database** → **Blob**
3. Choisir le plan **Hobby** (gratuit)
4. Cliquer **Create**
5. Les variables seront ajoutées automatiquement:
   - `BLOB_READ_WRITE_TOKEN`

---

### Étape 4: Redéployer avec les nouvelles variables

Une fois toutes les variables configurées:

1. Aller dans **Deployments**
2. Sur le dernier déploiement, cliquer sur **...** (menu)
3. Cliquer **Redeploy**
4. Cocher **Use existing Build Cache**
5. Cliquer **Redeploy**

**OU via CLI:**

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager
vercel --prod
```

---

### Étape 5: Exécuter les Migrations Prisma

Une fois le déploiement réussi:

#### Option A: Via Vercel Dashboard (Postgres SQL Editor)

1. Aller sur: https://vercel.com/erwan-henrys-projects/next-app/stores
2. Cliquer sur votre **Postgres Database**
3. Cliquer sur **Query** (SQL Editor)
4. Exécuter la migration:

```sql
-- Copier le contenu de prisma/migrations/init/migration.sql
-- OU créer les tables manuellement (voir ci-dessous)
```

#### Option B: Via CLI avec connexion directe

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager

# Récupérer les variables Vercel en local
vercel env pull .env.local

# Exécuter les migrations
npx prisma migrate deploy

# Ou générer le client et push le schema
npx prisma generate
npx prisma db push
```

---

### Étape 6: Créer l'Utilisateur Admin

#### Via Vercel Postgres SQL Editor:

```sql
INSERT INTO users (
  id,
  email,
  password,
  name,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQs9kKgU6', -- password: admin123
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

**Login:**
- Email: `admin@example.com`
- Password: `admin123`

⚠️ **IMPORTANT:** Changez ce mot de passe immédiatement après la première connexion!

---

### Étape 7: Désactiver la Protection de Déploiement

Par défaut, Vercel active une protection d'authentification. Pour la désactiver:

1. Aller sur: https://vercel.com/erwan-henrys-projects/next-app/settings/deployment-protection
2. Désactiver **Vercel Authentication**
3. Ou configurer **Password Protection** avec un mot de passe personnalisé

---

### Étape 8: Vérifier l'Application

1. **URL de l'app:** https://next-app-erwan-henrys-projects.vercel.app
2. Tester:
   - ✅ Page d'accueil charge
   - ✅ `/auth/login` fonctionne
   - ✅ Login avec admin/admin123
   - ✅ Dashboard accessible
   - ✅ `/api/health` retourne 200

---

## 🐛 Résolution de Problèmes

### Build échoue avec "Cannot find module 'next'"

**Solution:**
```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager
npm install
git add package-lock.json
git commit -m "fix: add package-lock.json"
git push
```

### "NEXTAUTH_SECRET is not defined"

**Solution:** Ajouter la variable dans Vercel Settings → Environment Variables

### "Prisma schema not found"

**Solution:** Le fichier `prisma/schema.prisma` doit être à la racine du projet Next.js

### Database connection failed

**Solution:**
1. Vérifier que Postgres est créé
2. Vérifier que `POSTGRES_PRISMA_URL` est définie
3. Redéployer

### Page demande authentification Vercel

**Solution:** Désactiver la protection dans Settings → Deployment Protection

---

## 📊 État Actuel

- ✅ Code sur GitHub
- ✅ Projet Vercel créé
- ⏳ Build en cours
- ⏳ Variables d'environnement à configurer
- ⏳ Storage Postgres/KV/Blob à créer
- ⏳ Migrations à exécuter
- ⏳ Utilisateur admin à créer

---

## 🔗 Liens Utiles

- **GitHub Repo:** https://github.com/ErwanHenry/apec-job-manager
- **Vercel Dashboard:** https://vercel.com/erwan-henrys-projects/next-app
- **Deployments:** https://vercel.com/erwan-henrys-projects/next-app/deployments
- **Settings:** https://vercel.com/erwan-henrys-projects/next-app/settings
- **Storage:** https://vercel.com/erwan-henrys-projects/next-app/stores
- **Logs:** https://vercel.com/erwan-henrys-projects/next-app/logs

---

## 🎯 Commandes Rapides

```bash
# Aller dans le projet
cd /Users/erwanhenry/claude-projects/apec-job-manager

# Vérifier le statut du déploiement
vercel ls

# Récupérer les variables en local
vercel env pull .env.local

# Déployer en production
vercel --prod

# Voir les logs en temps réel
vercel logs --follow

# Ouvrir le dashboard
vercel

# Générer un nouveau secret
openssl rand -base64 32
```

---

## 📞 Besoin d'aide?

Consultez la documentation complète:
- [DEPLOY_NOW.md](./DEPLOY_NOW.md)
- [README_DEPLOY.md](./README_DEPLOY.md)
- [docs/SERVERLESS_ARCHITECTURE.md](./docs/SERVERLESS_ARCHITECTURE.md)

---

**Status:** ⏳ Build en cours, finalisation manuelle requise
**Prochaine étape:** Vérifier le dashboard Vercel et configurer les variables
