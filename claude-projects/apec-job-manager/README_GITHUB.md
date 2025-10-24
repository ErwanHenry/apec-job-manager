# 🚀 APEC Job Manager

> Outil d'automatisation complet pour gérer vos annonces d'emploi APEC.FR

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ErwanHenry/apec-job-manager&env=NEXTAUTH_URL,NEXTAUTH_SECRET,APEC_EMAIL,APEC_PASSWORD&envDescription=Variables%20d'environnement%20requises&envLink=https://github.com/ErwanHenry/apec-job-manager/blob/main/.env.example&project-name=apec-job-manager&repository-name=apec-job-manager&demo-title=APEC%20Job%20Manager&demo-description=Automatisez%20la%20gestion%20de%20vos%20annonces%20APEC&demo-url=https://apec-job-manager.vercel.app&demo-image=https://raw.githubusercontent.com/ErwanHenry/apec-job-manager/main/.github/banner.png)

## ✨ Fonctionnalités

### 🔐 Authentification Multi-Utilisateurs
- **NextAuth.js** avec 3 rôles (Admin, Manager, User)
- Inscription/Connexion sécurisée
- Gestion complète des utilisateurs
- Protection des routes par rôle

### 🤖 Automatisation APEC
- Connexion automatique à votre compte APEC entreprise
- Création/Modification/Suppression d'annonces
- Synchronisation automatique toutes les 6h
- Suivi des vues et candidatures

### 📊 Dashboard Complet
- Vue d'ensemble avec statistiques en temps réel
- Graphiques de performance (Recharts)
- Liste des annonces avec filtres
- Historique de synchronisation

### 📈 Système de Reporting
- Rapports quotidiens/hebdomadaires/mensuels
- Export PDF/CSV/JSON
- Envoi automatique par email
- Métriques avancées (taux de conversion, etc.)

### ☁️ 100% Cloud (Vercel)
- **Vercel Postgres** - Base de données
- **Vercel KV** - Cache Redis
- **Vercel Blob** - Stockage fichiers
- **Cron Jobs** - 3 tâches automatiques
- **Edge Network** - Performance mondiale

## 🚀 Déploiement Rapide (2 minutes)

### Option 1: One-Click Deploy ⭐

1. Cliquez sur le bouton **Deploy with Vercel** ci-dessus
2. Remplissez 4 variables d'environnement:
   - `NEXTAUTH_URL` - URL de votre app (auto)
   - `NEXTAUTH_SECRET` - Générer: `openssl rand -base64 32`
   - `APEC_EMAIL` - Votre email APEC entreprise
   - `APEC_PASSWORD` - Votre mot de passe APEC
3. Cliquez sur **Deploy**
4. Attendez 2 minutes ⏱️
5. Votre app est en ligne! 🎉

### Option 2: CLI Automatisé (5 minutes)

```bash
# Cloner le repo
git clone https://github.com/ErwanHenry/apec-job-manager.git
cd apec-job-manager

# Exécuter le script de setup
./scripts/setup-vercel.sh
```

**Le script fait tout:**
- ✅ Configure Vercel CLI
- ✅ Crée Postgres, KV, Blob
- ✅ Génère les secrets
- ✅ Configure les variables
- ✅ Exécute les migrations
- ✅ Déploie en production

## 📖 Documentation

- **[DEPLOY_NOW.md](./DEPLOY_NOW.md)** - Guide déploiement 2-5 min ⭐ Commencez ici
- **[README_DEPLOY.md](./README_DEPLOY.md)** - Guide complet (900+ lignes)
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Quick start
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - API Reference
- **[docs/SERVERLESS_ARCHITECTURE.md](./docs/SERVERLESS_ARCHITECTURE.md)** - Architecture

## 🔧 Stack Technique

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Recharts (graphiques)

**Backend:**
- Next.js API Routes (Serverless)
- Prisma 5 (ORM)
- NextAuth.js 4 (Auth)
- Puppeteer (automation APEC)

**Infrastructure:**
- Vercel (Hosting)
- Vercel Postgres (Database)
- Vercel KV (Redis cache)
- Vercel Blob (File storage)
- Vercel Cron Jobs (Scheduled tasks)

## 📂 Structure du Projet

```
apec-job-manager/
├── next-app/                    # Application Next.js principale
│   ├── app/                     # App Router
│   │   ├── (auth)/             # Pages authentification
│   │   ├── (dashboard)/        # Pages dashboard
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API Routes
│   ├── components/             # Composants React
│   ├── lib/                    # Services & utils
│   └── prisma/                 # Database schema
├── scripts/                    # Scripts d'automatisation
├── docs/                       # Documentation complète
└── .github/                    # CI/CD workflows
```

## 🎯 Features par Rôle

### 👤 User (Utilisateur)
- Voir les annonces
- Consulter les statistiques

### 👔 Manager
- Tout ce que User peut faire +
- Créer/Modifier des annonces
- Générer des rapports
- Configurer la synchronisation

### 👑 Admin
- Tout ce que Manager peut faire +
- Gérer les utilisateurs
- Changer les rôles
- Accès aux audit logs
- Configuration système

## 🔐 Sécurité

- ✅ **NextAuth.js** - Authentification sécurisée
- ✅ **bcrypt** - Hash des mots de passe
- ✅ **CSRF Protection** - Intégrée Next.js
- ✅ **Rate Limiting** - Protection DDoS
- ✅ **Audit Logs** - Traçabilité complète
- ✅ **HTTPS** - Certificat SSL automatique (Vercel)
- ✅ **Headers sécurité** - HSTS, XSS Protection, etc.

## 📊 Cron Jobs Automatiques

3 tâches planifiées sur Vercel:

1. **Sync APEC** - Toutes les 6h (`0 */6 * * *`)
   - Synchronise les annonces avec APEC
   - Met à jour vues/candidatures

2. **Rapport Quotidien** - 8h00 chaque jour (`0 8 * * *`)
   - Génère le rapport journalier
   - Envoie par email (optionnel)

3. **Nettoyage DB** - 2h00 chaque jour (`0 2 * * *`)
   - Supprime les anciennes données
   - Optimise la base

## 💰 Coûts Vercel

### Plan Gratuit (Hobby)
- ❌ **1 cron job seulement** (besoin de 3)
- ✅ Suffisant pour tester

### Plan Pro: $20/mois ⭐ Recommandé
- ✅ **Cron jobs illimités**
- ✅ 1000 GB-Hours fonctions
- ✅ 1 TB bandwidth
- ✅ Postgres 256 MB
- ✅ KV 256 MB
- ✅ Support prioritaire

## 🆘 Support & Aide

### Documentation
- [Guide démarrage rapide](./DEPLOY_NOW.md)
- [Troubleshooting](./README_DEPLOY.md#problèmes-courants)
- [API Reference](./docs/API_DOCUMENTATION.md)

### Issues
Rencontrez un problème? [Ouvrez une issue](https://github.com/ErwanHenry/apec-job-manager/issues)

### Questions
Des questions? Consultez la [documentation complète](./README_DEPLOY.md)

## 📝 Licence

MIT - Libre d'utilisation

## 🙏 Crédits

Créé avec ❤️ en utilisant:
- [Next.js](https://nextjs.org)
- [Vercel](https://vercel.com)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [Claude Code](https://claude.com/claude-code)

---

## 🚀 Prêt à démarrer?

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ErwanHenry/apec-job-manager&env=NEXTAUTH_URL,NEXTAUTH_SECRET,APEC_EMAIL,APEC_PASSWORD&project-name=apec-job-manager)

**Ou suivez le guide:**
```bash
git clone https://github.com/ErwanHenry/apec-job-manager.git
cd apec-job-manager
open DEPLOY_NOW.md
```

---

**Version:** 2.0.0
**Status:** ✅ Production Ready
**Dernière MAJ:** Octobre 2024
