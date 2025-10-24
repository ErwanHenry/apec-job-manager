# 🚀 Déployer en 5 Minutes - APEC Job Manager

Guide ultra-rapide pour déployer votre application sur Vercel.

## ⚡ Option 1: One-Click Deploy (2 minutes)

### Étape 1: Cliquer sur le bouton

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/apec-job-manager&env=NEXTAUTH_SECRET,APEC_EMAIL,APEC_PASSWORD&project-name=apec-job-manager&repository-name=apec-job-manager)

### Étape 2: Remplir les variables

Vercel vous demandera 3 variables essentielles:

1. **NEXTAUTH_SECRET** - Générez avec:
   ```bash
   openssl rand -base64 32
   ```

2. **APEC_EMAIL** - Votre email APEC entreprise

3. **APEC_PASSWORD** - Votre mot de passe APEC

### Étape 3: Activer les services Vercel

1. Allez sur votre dashboard Vercel
2. Cliquez sur votre projet → **Storage**
3. Activez:
   - ✅ **Postgres** (gratuit jusqu'à 256 MB)
   - ✅ **KV** (gratuit jusqu'à 256 MB)
   - ✅ **Blob** (gratuit jusqu'à 1 GB)

### Étape 4: Créer le premier utilisateur admin

Ouvrez la console Vercel Postgres:

```sql
INSERT INTO users (id, email, password, name, role, "isActive", "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-' || gen_random_uuid(),
  'admin@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYfQs9kKgU6', -- password: admin123
  'Admin',
  'ADMIN',
  true,
  NOW(),
  NOW(),
  NOW()
);
```

### Étape 5: Accéder à l'application

Votre app est en ligne! 🎉

- **URL**: `https://votre-projet.vercel.app`
- **Login**: `admin@example.com` / `admin123`

---

## 🔧 Option 2: CLI Automatisé (5 minutes)

Pour les développeurs qui préfèrent le terminal.

### 1. Prérequis

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login
```

### 2. Script automatique

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager
./scripts/setup-vercel.sh
```

Le script fait tout:
- ✅ Configure Vercel CLI
- ✅ Crée Postgres, KV, Blob
- ✅ Génère les secrets (NextAuth, JWT, Cron)
- ✅ Configure toutes les variables d'environnement
- ✅ Exécute les migrations Prisma
- ✅ Déploie en production
- ✅ Crée l'utilisateur admin par défaut

**Durée:** 5 minutes

### 3. Vérification

```bash
# Health check
curl https://votre-projet.vercel.app/api/health

# Voir les logs
vercel logs --follow
```

---

## 🆕 Option 3: Fork & Deploy (3 minutes)

### 1. Fork le repo

Cliquez sur "Fork" sur GitHub: https://github.com/your-username/apec-job-manager

### 2. Connecter à Vercel

1. Allez sur https://vercel.com/new
2. Sélectionnez votre fork
3. Configurez les variables d'environnement:

```env
# Authentication
NEXTAUTH_URL=https://votre-projet.vercel.app
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>

# APEC Credentials
APEC_EMAIL=erwan.henry@spikeelabs.fr
APEC_PASSWORD=AbcWxcvbn1234*

# Vercel Postgres (auto-rempli)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Vercel KV (auto-rempli)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Vercel Blob (auto-rempli)
BLOB_READ_WRITE_TOKEN=

# Optional: Cron Secret
CRON_SECRET=<générer avec: openssl rand -base64 32>
```

### 3. Activer Storage

Dans le dashboard Vercel → Storage → Activer Postgres, KV, Blob

### 4. Déployer

Cliquez sur "Deploy" et attendez 2 minutes.

---

## 📱 Accès à l'application

### URLs

- **Production**: `https://votre-projet.vercel.app`
- **Dashboard**: `https://votre-projet.vercel.app/dashboard`
- **API Health**: `https://votre-projet.vercel.app/api/health`

### Comptes par défaut

Après le premier déploiement, créez votre admin via SQL ou utilisez:

**Admin:**
- Email: `admin@example.com`
- Password: `admin123`

**Manager:**
- Email: `manager@example.com`
- Password: `manager123`

**⚠️ IMPORTANT:** Changez ces mots de passe immédiatement en production!

---

## ✅ Checklist Post-Déploiement

Après le déploiement, vérifiez:

- [ ] `/api/health` retourne 200 OK
- [ ] Login fonctionne avec admin
- [ ] Dashboard accessible
- [ ] Cron jobs actifs (Vercel Dashboard → Cron Jobs)
- [ ] Database connectée (Vercel Dashboard → Storage → Postgres)
- [ ] KV cache actif (Vercel Dashboard → Storage → KV)

---

## 🔐 Sécurité Post-Déploiement

### 1. Changer les mots de passe par défaut

```sql
-- Via Vercel Postgres SQL Editor
UPDATE users
SET password = '$2a$12$...' -- Nouveau hash bcrypt
WHERE email = 'admin@example.com';
```

Pour générer un nouveau hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('nouveau_mdp', 12))"
```

### 2. Configurer les variables d'environnement

Allez sur Vercel Dashboard → Votre Projet → Settings → Environment Variables

Mettez à jour:
- `APEC_EMAIL` - Votre vrai email APEC
- `APEC_PASSWORD` - Votre vrai mot de passe
- `NEXTAUTH_SECRET` - Générer un nouveau secret

### 3. Activer HTTPS

Vercel active automatiquement HTTPS avec certificat SSL.

Vérifiez: `https://votre-projet.vercel.app` (pas http)

---

## 📊 Monitoring

### Vercel Dashboard

- **Analytics**: Trafic, performances, erreurs
- **Logs**: Logs en temps réel des fonctions
- **Cron Jobs**: Historique d'exécution
- **Usage**: Consommation (functions, bandwidth, storage)

### API Health Check

```bash
# Vérifier la santé de l'app
curl https://votre-projet.vercel.app/api/health
```

Réponse attendue:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "checks": {
    "database": { "status": "up", "latency": 45 },
    "kv": { "status": "up", "latency": 12 },
    "blob": { "status": "up" }
  }
}
```

---

## 🆘 Problèmes Courants

### Build échoue

**Erreur:** `Cannot find module 'next'`

**Solution:**
```bash
cd next-app
npm install
git add package-lock.json
git commit -m "fix: add lockfile"
git push
```

### Variables d'environnement manquantes

**Erreur:** `NEXTAUTH_SECRET is not defined`

**Solution:** Vercel Dashboard → Settings → Environment Variables → Ajouter les variables

### Database connection failed

**Erreur:** `P1001: Can't reach database`

**Solution:**
1. Activez Vercel Postgres
2. Copiez `POSTGRES_PRISMA_URL` dans les variables
3. Redéployez

### Prisma schema mismatch

**Erreur:** `Schema mismatch detected`

**Solution:**
```bash
# Localement
npx prisma migrate deploy

# Ou via Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
vercel --prod
```

---

## 📚 Documentation Complète

Pour aller plus loin:

- **Guide complet**: [README_DEPLOY.md](./README_DEPLOY.md)
- **Quick Start**: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- **Architecture**: [docs/SERVERLESS_ARCHITECTURE.md](./docs/SERVERLESS_ARCHITECTURE.md)
- **API Reference**: [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

---

## 💰 Coûts

### Plan Gratuit (Hobby)

✅ **Suffisant pour démarrer:**
- 100 GB-Hours fonctions
- 100 GB bandwidth
- Postgres: 256 MB
- KV: 256 MB, 30K opérations/jour
- Blob: 1 GB
- 1 cron job

### Plan Pro ($20/mois)

✅ **Recommandé pour production:**
- 1000 GB-Hours fonctions
- 1 TB bandwidth
- Postgres: 256 MB, 60 compute hours
- KV: 256 MB, 1M reads, 250K writes
- Blob: 1 GB
- **Cron jobs illimités** (besoin de 3)

---

## 🎉 Félicitations!

Votre application APEC Job Manager est maintenant en ligne!

**Prochaines étapes:**
1. ✅ Créer votre compte admin
2. ✅ Configurer vos identifiants APEC dans Settings
3. ✅ Créer votre première annonce
4. ✅ Lancer la synchronisation
5. ✅ Inviter votre équipe

**Questions?** Consultez [README_DEPLOY.md](./README_DEPLOY.md) pour le guide complet.

---

**Deploy Time:** 2-5 minutes
**Status:** ✅ Production Ready
**Version:** 2.0.0 (Next.js 14 + Vercel)
