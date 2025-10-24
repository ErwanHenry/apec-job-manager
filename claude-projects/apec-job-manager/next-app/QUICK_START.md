# 🚀 Quick Start - APEC Job Manager Next.js

Guide de démarrage rapide pour lancer l'application en 5 minutes.

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL installé (local ou cloud)
- Git installé

## ⚡ Installation en 5 étapes

### 1. Installer les dépendances

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager/next-app
npm install
```

### 2. Configurer les variables d'environnement

```bash
# Copier le template
cp .env.local.example .env.local

# Éditer .env.local
nano .env.local
```

**Variables minimales requises:**

```bash
# Database (PostgreSQL local ou Vercel)
DATABASE_URL="postgresql://user:password@localhost:5432/apec_db"

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_SECRET="votre-secret-32-caracteres-aleatoires"
NEXTAUTH_URL="http://localhost:3000"

# APEC Credentials
APEC_EMAIL="votre-email@apec.fr"
APEC_PASSWORD="votre-mot-de-passe"
```

### 3. Configurer la base de données

```bash
# Générer Prisma Client
npm run db:generate

# Créer les tables dans PostgreSQL
npm run db:push

# (Optionnel) Ouvrir Prisma Studio pour visualiser
npm run db:studio
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

### 5. Créer votre premier compte

1. Accéder à http://localhost:3000
2. Cliquer sur "Créer un compte"
3. Remplir le formulaire d'inscription
4. Se connecter avec vos identifiants

---

## 🗄️ Setup PostgreSQL Local

### Option 1: PostgreSQL avec Docker

```bash
# Lancer PostgreSQL avec Docker
docker run --name apec-postgres \
  -e POSTGRES_USER=apec \
  -e POSTGRES_PASSWORD=apec123 \
  -e POSTGRES_DB=apec_db \
  -p 5432:5432 \
  -d postgres:15

# DATABASE_URL dans .env.local
DATABASE_URL="postgresql://apec:apec123@localhost:5432/apec_db"
```

### Option 2: PostgreSQL installé localement

```bash
# macOS avec Homebrew
brew install postgresql@15
brew services start postgresql@15

# Créer la database
createdb apec_db

# DATABASE_URL dans .env.local
DATABASE_URL="postgresql://localhost:5432/apec_db"
```

### Option 3: Vercel Postgres (Production)

1. Aller sur Vercel Dashboard
2. Créer un projet
3. Onglet "Storage" > "Create Database" > "Postgres"
4. Copier `DATABASE_URL` dans Environment Variables

---

## 🔐 Générer NEXTAUTH_SECRET

```bash
# Générer un secret sécurisé
openssl rand -base64 32

# Copier le résultat dans .env.local
NEXTAUTH_SECRET="le-secret-genere-ici"
```

---

## 📊 Vérifier l'installation

### Test 1: Server health

```bash
curl http://localhost:3000
# Devrait rediriger vers /login ou /dashboard
```

### Test 2: Database connection

```bash
# Ouvrir Prisma Studio
npm run db:studio

# Naviguer vers http://localhost:5555
# Vous devriez voir les tables: User, Job, etc.
```

### Test 3: Créer un compte test

```bash
# Via interface web
1. Aller sur http://localhost:3000/register
2. Créer compte: test@test.com / password123
3. Se connecter
4. Vérifier accès dashboard
```

---

## 🎨 Navigation de l'application

Une fois connecté, vous avez accès à:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/dashboard` | Statistiques et vue d'ensemble |
| Annonces | `/jobs` | Liste des annonces avec filtres |
| Rapports | `/reports` | Rapports et analytics |
| Paramètres | `/settings` | Configuration utilisateur |

---

## 🛠️ Commandes utiles

```bash
# Développement
npm run dev              # Lancer serveur dev (port 3000)
npm run build            # Build production
npm start                # Lancer serveur production

# Database
npm run db:generate      # Générer Prisma Client
npm run db:push          # Appliquer schéma à DB
npm run db:studio        # Ouvrir Prisma Studio (port 5555)

# Qualité
npm run lint             # Linter Next.js
npm run type-check       # Vérification TypeScript

# Production
npm run prepare-prod     # Générer Prisma + Build
```

---

## 🐛 Troubleshooting

### Erreur: "Can't reach database server"

**Solution:**
```bash
# Vérifier que PostgreSQL est lancé
# macOS
brew services list

# Docker
docker ps | grep postgres

# Tester connexion
psql postgresql://localhost:5432/apec_db
```

### Erreur: "Prisma Client not generated"

**Solution:**
```bash
npm run db:generate
```

### Erreur: "NextAuth JWT error"

**Solution:**
```bash
# Vérifier que NEXTAUTH_SECRET est défini dans .env.local
echo $NEXTAUTH_SECRET

# Si vide, générer un nouveau
openssl rand -base64 32
```

### Erreur: "Port 3000 already in use"

**Solution:**
```bash
# Tuer le processus sur port 3000
lsof -ti:3000 | xargs kill -9

# Ou changer le port
PORT=3001 npm run dev
```

### Erreur: "Module not found"

**Solution:**
```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Données de test

### Créer des jobs de test manuellement

```typescript
// Via Prisma Studio (http://localhost:5555)
// Ou via script seed (à créer)

// Exemple de job
{
  apecId: "TEST-001",
  title: "Développeur Full Stack",
  description: "Rejoignez notre équipe...",
  location: "Paris, France",
  contractType: "CDI",
  salary: "45-55K€",
  status: "PUBLISHED",
  views: 150,
  applications: 12
}
```

### Seed script (optionnel)

```bash
# Créer prisma/seed.ts
npm run db:seed
```

---

## 🚀 Déploiement sur Vercel

### En 3 clics

1. **Push sur GitHub**
   ```bash
   git add .
   git commit -m "Initial Next.js migration"
   git push origin main
   ```

2. **Connecter à Vercel**
   - Aller sur https://vercel.com
   - "Import Project"
   - Sélectionner le repo GitHub
   - Framework: Next.js (auto-détecté)

3. **Configurer Environment Variables**
   - Ajouter toutes les variables de `.env.local`
   - Utiliser Vercel Postgres pour `DATABASE_URL`
   - Deploy!

**URL de production:** `https://votre-app.vercel.app`

---

## 📞 Support

**Documentation:**
- README.md - Documentation complète
- MIGRATION_REPORT.md - Rapport détaillé de migration

**Ressources:**
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

**Issues:**
- Créer une issue sur GitHub
- Contacter l'équipe APEC Job Manager

---

## ✅ Checklist de démarrage

- [ ] Node.js 18+ installé
- [ ] PostgreSQL lancé (local ou cloud)
- [ ] `npm install` exécuté
- [ ] `.env.local` configuré avec toutes les variables
- [ ] `npm run db:generate` exécuté
- [ ] `npm run db:push` exécuté
- [ ] `npm run dev` lancé
- [ ] Compte test créé
- [ ] Dashboard accessible
- [ ] Prisma Studio testé

**Une fois tout coché, vous êtes prêt! 🎉**

---

**Dernière mise à jour:** 24 octobre 2025
**Version:** 2.0.0
