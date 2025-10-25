# APEC Job Manager - Next.js 14

Application Next.js 14 moderne pour la gestion automatisée des annonces APEC.FR.

## 🚀 Technologies

- **Next.js 14** - App Router, Server Components, API Routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling avec couleurs APEC
- **NextAuth.js** - Authentication
- **Prisma** - ORM avec PostgreSQL
- **Puppeteer** - Web scraping APEC
- **Recharts** - Data visualization
- **date-fns** - Date formatting

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos configurations

# Générer Prisma Client
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 🗂️ Structure du projet

```
apec-job-manager/
├── app/                          # App Router
│   ├── (auth)/                   # Routes d'authentification
│   │   ├── login/               # Page de connexion
│   │   └── register/            # Page d'inscription
│   ├── (dashboard)/             # Routes protégées
│   │   ├── dashboard/           # Tableau de bord
│   │   ├── jobs/                # Gestion des annonces
│   │   ├── reports/             # Rapports
│   │   └── settings/            # Paramètres
│   ├── api/                     # API Routes
│   │   ├── auth/                # NextAuth endpoints
│   │   ├── jobs/                # CRUD annonces
│   │   ├── reports/             # Génération rapports
│   │   └── dashboard/           # Statistiques
│   ├── layout.tsx               # Layout racine
│   ├── page.tsx                 # Page d'accueil
│   └── globals.css              # Styles globaux
├── components/                   # Composants React
│   ├── ui/                      # Composants UI de base
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── layout/                  # Composants de layout
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── jobs/                    # Composants annonces
│   ├── dashboard/               # Composants dashboard
│   │   ├── StatsCards.tsx
│   │   ├── RecentJobs.tsx
│   │   └── SyncHistory.tsx
│   └── charts/                  # Composants graphiques
├── lib/                         # Utilitaires et services
│   ├── auth/                    # Configuration NextAuth
│   │   └── authOptions.ts
│   ├── db/                      # Database
│   │   └── prisma.ts
│   ├── services/                # Services métier
│   │   └── apecSyncService.ts
│   ├── types/                   # Types TypeScript
│   │   └── index.ts
│   └── utils/                   # Fonctions utilitaires
├── prisma/                      # Prisma ORM
│   └── schema.prisma            # Schéma de base de données
├── public/                      # Assets statiques
├── middleware.ts                # Next.js middleware (auth)
├── next.config.js               # Configuration Next.js
├── tailwind.config.ts           # Configuration Tailwind
├── tsconfig.json                # Configuration TypeScript
├── vercel.json                  # Configuration Vercel
└── package.json                 # Dépendances
```

## 🔑 Variables d'environnement

Voir `.env.local.example` pour la liste complète des variables requises.

**Essentielles:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret pour NextAuth (générer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL de l'application
- `APEC_EMAIL` - Email APEC
- `APEC_PASSWORD` - Mot de passe APEC

## 🎨 Couleurs APEC

Le thème Tailwind inclut les couleurs officielles APEC:

```typescript
apec: {
  blue: '#0066CC',      // Bleu principal APEC
  gray: '#53565A',      // Gris APEC
  green: '#00A85A',     // Vert succès
  orange: '#FF6B35',    // Orange avertissement
  red: '#E63946',       // Rouge erreur
}
```

## 📱 Pages disponibles

### Authentification
- `/login` - Connexion
- `/register` - Inscription

### Dashboard (protégé)
- `/dashboard` - Tableau de bord avec statistiques
- `/jobs` - Liste des annonces
- `/jobs/[id]` - Détail d'une annonce
- `/reports` - Rapports et analytics
- `/settings` - Paramètres utilisateur

## 🔌 API Routes

### Auth
- `POST /api/auth/register` - Inscription
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Jobs
- `GET /api/jobs` - Liste des annonces (avec pagination et filtres)
- `POST /api/jobs` - Créer une annonce
- `GET /api/jobs/[id]` - Obtenir une annonce
- `PATCH /api/jobs/[id]` - Mettre à jour une annonce
- `DELETE /api/jobs/[id]` - Supprimer une annonce (soft delete)
- `POST /api/jobs/sync` - Synchroniser avec APEC
- `GET /api/jobs/sync` - Statut de synchronisation

### Dashboard
- `GET /api/dashboard/stats` - Statistiques du tableau de bord

### Reports
- `GET /api/reports` - Liste des rapports
- `POST /api/reports` - Générer un rapport

## 🧪 Scripts NPM

```bash
# Développement
npm run dev              # Lancer serveur développement
npm run build            # Build pour production
npm start                # Lancer serveur production

# Database
npm run db:generate      # Générer Prisma Client
npm run db:push          # Pousser schéma vers DB
npm run db:studio        # Ouvrir Prisma Studio
npm run db:seed          # Seed database

# Qualité
npm run lint             # Linter Next.js
npm run type-check       # Vérification TypeScript

# Production
npm run prepare-prod     # Préparer pour production (db:generate + build)
```

## 🚢 Déploiement sur Vercel

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel Dashboard
3. Déployer automatiquement sur push

**Configuration Vercel:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Development Command: `npm run dev`

**Variables d'environnement à configurer:**
- Toutes les variables de `.env.local.example`
- `DATABASE_URL` via Vercel Postgres integration

## 🔒 Sécurité

- Authentification via NextAuth.js
- Middleware pour protéger les routes
- Mots de passe hashés avec bcrypt
- Headers de sécurité configurés
- Validation des inputs avec Zod
- Rate limiting sur API routes (à implémenter)

## 📊 Fonctionnalités

✅ **Implémenté:**
- Authentification (login/register)
- Dashboard avec statistiques
- Liste des annonces avec pagination
- Filtres et recherche
- API CRUD complète
- Protection des routes
- UI responsive avec Tailwind
- Thème couleurs APEC

🚧 **À implémenter:**
- Synchronisation APEC complète (scraping)
- Génération de rapports PDF
- Graphiques et analytics avancés
- Notifications par email
- Gestion des rôles avancée
- Tests unitaires et E2E

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT

## 👥 Auteurs

APEC Job Manager Team
