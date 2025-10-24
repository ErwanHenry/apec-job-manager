# APEC Job Manager - Quick Deploy Guide

## 🚀 Déploiement en 3 Étapes

### Étape 1: Setup Local (5 min)

```bash
# Clone et install
git clone https://github.com/your-username/apec-job-manager.git
cd apec-job-manager

# Run automated setup
./scripts/setup-vercel.sh
```

**Ce script fait:**
- ✅ Installe les dépendances
- ✅ Configure Vercel CLI
- ✅ Crée Postgres + KV + Blob
- ✅ Génère les secrets
- ✅ Run migrations
- ✅ Deploy sur Vercel

### Étape 2: GitHub Secrets (3 min)

```bash
# Configure CI/CD secrets
./scripts/setup-github-secrets.sh
```

**Secrets configurés:**
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID
- ✅ DATABASE_URL

### Étape 3: Deploy! (2 min)

```bash
# Push to trigger deployment
git commit --allow-empty -m "chore: initial deployment"
git push origin main

# Watch deployment
gh run watch
```

**Automatic:**
- ✅ Tests + Lint
- ✅ Build
- ✅ Deploy Production
- ✅ Health Check
- ✅ Smoke Tests

---

## 🎯 One-Click Alternative

Cliquez sur ce bouton pour déployer sans configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager)

Puis configurez:
1. APEC credentials
2. JWT secrets
3. SMTP (optionnel)

---

## 📋 Checklist Rapide

### Avant de commencer
- [ ] Compte Vercel (gratuit)
- [ ] Compte GitHub
- [ ] Node.js 18+
- [ ] Credentials APEC

### Après déploiement
- [ ] Tester `/api/health` → 200 OK
- [ ] Dashboard accessible
- [ ] Cron jobs actifs (Vercel Dashboard)
- [ ] Email de test envoyé

---

## 🔧 Configuration Manuelle Rapide

Si vous préférez configurer manuellement:

### 1. Vercel Dashboard

```bash
# Deploy
vercel --prod

# Add Postgres
vercel postgres create apec-db --region cdg1

# Add KV
vercel kv create apec-kv --region cdg1

# Add Blob
vercel blob create apec-blob
```

### 2. Environment Variables

Dans Vercel Dashboard → Settings → Environment Variables:

```env
APEC_EMAIL=your@email.com
APEC_PASSWORD=your_password
JWT_SECRET=<generate with: openssl rand -hex 32>
NEXTAUTH_SECRET=<generate with: openssl rand -hex 32>
CRON_SECRET=<generate with: openssl rand -hex 32>
```

### 3. Database

```bash
# Pull env vars
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

---

## 🐛 Troubleshooting Rapide

### Build fails
```bash
# Clean install
rm -rf node_modules dashboard/node_modules
npm install
cd dashboard && npm install
```

### Database error
```bash
# Check connection
npx prisma db push

# Regenerate client
npx prisma generate
```

### Cron jobs not running
- Upgrade to Vercel Pro ($20/mois)
- Free plan = 1 cron/day only

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **[README_DEPLOY.md](./README_DEPLOY.md)** - Guide complet (900+ lignes)
- **[DEPLOYMENT_REPORT.md](./DEPLOYMENT_REPORT.md)** - Rapport technique
- **[DEPLOY_BUTTON.md](./DEPLOY_BUTTON.md)** - One-click deploy
- **[docs/GITHUB_SECRETS_SETUP.md](./docs/GITHUB_SECRETS_SETUP.md)** - CI/CD setup

---

## ⚡ Commandes Essentielles

```bash
# Deploy
vercel --prod

# Logs en temps réel
vercel logs --follow

# Test local
npm run dev:all

# Database
npx prisma studio

# Health check
curl https://your-app.vercel.app/api/health
```

---

## 💰 Coûts

| Plan | Prix | Recommandation |
|------|------|----------------|
| **Free** | 0€ | Dev/Test only |
| **Pro** | 20€/mois | **Production** |

**Pro requis pour:**
- 3 cron jobs
- Analytics avancés
- Support prioritaire

---

## 🎉 Vous êtes prêt!

**Durée totale:** 10 minutes
**Commande unique:** `./scripts/setup-vercel.sh`

Des questions? Voir [README_DEPLOY.md](./README_DEPLOY.md)
