# 🏗️ Architecture - APEC Job Manager Next.js 14

Architecture complète de l'application avec diagrammes visuels.

---

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    APEC Job Manager v2.0                        │
│                      Next.js 14 App                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├── Vercel Deployment
                              │   ├── CDN Global
                              │   ├── Edge Functions
                              │   └── Serverless Functions
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  Pages  │          │   API   │          │ Database│
   │  (SSR)  │          │ Routes  │          │ (Prisma)│
   └─────────┘          └─────────┘          └─────────┘
        │                     │                     │
        │                     │                     │
   ┌────▼─────────────────────▼─────────────────────▼────┐
   │           PostgreSQL (Vercel Postgres)              │
   └──────────────────────────────────────────────────────┘
```

---

## 🗂️ Structure de dossiers (Tree View)

```
next-app/
│
├── 📱 app/                                 # App Router Next.js
│   ├── 🔐 (auth)/                         # Groupe authentification
│   │   ├── login/
│   │   │   └── page.tsx                   # Page connexion
│   │   └── register/
│   │       └── page.tsx                   # Page inscription
│   │
│   ├── 📊 (dashboard)/                    # Groupe dashboard protégé
│   │   ├── layout.tsx                     # Layout commun (Sidebar + Header)
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Tableau de bord
│   │   ├── jobs/
│   │   │   └── page.tsx                   # Liste annonces
│   │   ├── reports/
│   │   │   └── page.tsx                   # Rapports
│   │   └── settings/
│   │       └── page.tsx                   # Paramètres
│   │
│   ├── 🔌 api/                            # API Routes serverless
│   │   ├── auth/
│   │   │   ├── [...nextauth]/
│   │   │   │   └── route.ts               # NextAuth handler
│   │   │   └── register/
│   │   │       └── route.ts               # Inscription
│   │   ├── jobs/
│   │   │   ├── route.ts                   # GET + POST
│   │   │   ├── [id]/
│   │   │   │   └── route.ts               # GET + PATCH + DELETE
│   │   │   └── sync/
│   │   │       └── route.ts               # Synchronisation APEC
│   │   └── dashboard/
│   │       └── stats/
│   │           └── route.ts               # Statistiques
│   │
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Page d'accueil (redirect)
│   └── globals.css                        # Styles globaux
│
├── 🎨 components/                         # Composants React
│   ├── ui/                                # Composants UI de base
│   │   ├── Button.tsx                     # 4 variants
│   │   ├── Input.tsx                      # Input validé
│   │   └── Card.tsx                       # Card système
│   ├── layout/                            # Composants layout
│   │   ├── Sidebar.tsx                    # Navigation
│   │   └── Header.tsx                     # Header + menu
│   ├── dashboard/                         # Composants dashboard
│   │   ├── StatsCards.tsx                 # Cartes stats
│   │   ├── RecentJobs.tsx                 # Jobs récents
│   │   └── SyncHistory.tsx                # Historique sync
│   └── Providers.tsx                      # SessionProvider
│
├── 📚 lib/                                # Bibliothèques
│   ├── auth/
│   │   └── authOptions.ts                 # Config NextAuth
│   ├── db/
│   │   └── prisma.ts                      # Prisma Client
│   ├── services/
│   │   └── apecSyncService.ts             # Service sync
│   └── types/
│       └── index.ts                       # Types TS
│
├── 🗄️ prisma/
│   └── schema.prisma                      # Schéma DB
│
├── ⚙️ Configuration
│   ├── package.json                       # Dépendances
│   ├── tsconfig.json                      # TypeScript
│   ├── next.config.js                     # Next.js
│   ├── tailwind.config.ts                 # Tailwind
│   ├── vercel.json                        # Vercel
│   ├── middleware.ts                      # Auth middleware
│   └── .env.local.example                 # Env vars
│
└── 📖 Documentation
    ├── README.md                          # Doc principale
    ├── MIGRATION_REPORT.md                # Rapport migration
    ├── QUICK_START.md                     # Guide démarrage
    ├── FILES_CREATED.md                   # Liste fichiers
    └── ARCHITECTURE.md                    # Ce fichier
```

---

## 🔄 Flux de données

### 1. Authentification Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. POST /api/auth/register
     ▼
┌──────────────┐
│ API Register │
└──────┬───────┘
       │ 2. Hash password (bcrypt)
       ▼
┌──────────────┐
│   Prisma     │
└──────┬───────┘
       │ 3. Create User in DB
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ 4. Return User
       ▼
┌─────────────────┐
│ Redirect /login │
└─────────────────┘

┌─────────┐
│ Browser │
└────┬────┘
     │ 1. POST /api/auth/signin
     ▼
┌────────────┐
│  NextAuth  │
└─────┬──────┘
      │ 2. Verify credentials
      ▼
┌──────────────┐
│   Prisma     │
└──────┬───────┘
       │ 3. Find User + Compare password
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ 4. User found + valid
       ▼
┌────────────┐
│ Create JWT │
└─────┬──────┘
      │ 5. Set session cookie
      ▼
┌───────────────────┐
│ Redirect /dashboard│
└───────────────────┘
```

### 2. Dashboard Data Flow

```
┌─────────┐
│ Browser │  Navigate to /dashboard
└────┬────┘
     │
     ▼
┌──────────────────┐
│ Dashboard Page   │ Server Component
│ (Server Side)    │
└────┬─────────────┘
     │ 1. Fetch stats from DB
     ▼
┌──────────────┐
│   Prisma     │ Multiple queries in parallel
└──────┬───────┘
       │ 2. Aggregate data
       ▼
┌──────────────┐
│  PostgreSQL  │
│              │
│ - Job.count()│
│ - Job.sum()  │
│ - Recent jobs│
│ - Sync hist  │
└──────┬───────┘
       │ 3. Return data
       ▼
┌──────────────────┐
│ Render HTML      │ SSR with data
└────┬─────────────┘
     │ 4. Send to client
     ▼
┌──────────────────┐
│ Hydrate React    │ Interactive
└──────────────────┘
```

### 3. Jobs Management Flow

```
┌─────────┐
│ Browser │  View /jobs
└────┬────┘
     │
     ▼
┌──────────────────┐
│  Jobs Page       │ Client Component
│  (Client Side)   │
└────┬─────────────┘
     │ 1. useEffect fetch
     ▼
┌──────────────────┐
│ GET /api/jobs    │
│ ?page=1&status=  │
└────┬─────────────┘
     │ 2. Query with filters
     ▼
┌──────────────┐
│   Prisma     │
└──────┬───────┘
       │ 3. WHERE + SKIP + TAKE
       ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ 4. Return paginated jobs
       ▼
┌──────────────────┐
│ JSON Response    │
│ {                │
│   data: [...],   │
│   pagination: {} │
│ }                │
└────┬─────────────┘
     │ 5. setState(jobs)
     ▼
┌──────────────────┐
│ Re-render UI     │ Display jobs
└──────────────────┘
```

### 4. Synchronization Flow

```
┌─────────┐
│ Admin   │  Click "Synchroniser"
└────┬────┘
     │
     ▼
┌──────────────────┐
│ POST             │
│ /api/jobs/sync   │
└────┬─────────────┘
     │ 1. Check admin role
     ▼
┌──────────────────┐
│ ApecSyncService  │
└────┬─────────────┘
     │ 2. Create SyncHistory (pending)
     ▼
┌──────────────┐
│  Puppeteer   │
└──────┬───────┘
       │ 3. Launch browser
       ▼
┌──────────────┐
│  APEC.FR     │ Scrape jobs
└──────┬───────┘
       │ 4. Extract data
       ▼
┌──────────────────┐
│ Process Each Job │
│ - Check exists   │
│ - Create/Update  │
└────┬─────────────┘
     │ 5. Save to DB
     ▼
┌──────────────┐
│  PostgreSQL  │
└──────┬───────┘
       │ 6. Update SyncHistory (success)
       ▼
┌──────────────────┐
│ Return stats     │
│ {                │
│   created: 12,   │
│   updated: 5,    │
│   errors: []     │
│ }                │
└────┬─────────────┘
     │ 7. Show success message
     ▼
┌──────────────────┐
│ Refresh jobs list│
└──────────────────┘
```

---

## 🗄️ Schéma de base de données

```
┌─────────────────────────────────────────────────────────────┐
│                        PostgreSQL                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐        ┌─────────────────┐
│     User        │        │    Account      │
├─────────────────┤        ├─────────────────┤
│ id         UUID │◄───────│ userId     UUID │
│ email    String │        │ provider String │
│ password String │        │ access_token    │
│ role  UserRole  │        └─────────────────┘
│ createdAt  Date │
└─────────────────┘        ┌─────────────────┐
        │                  │    Session      │
        │                  ├─────────────────┤
        │                  │ userId     UUID │
        │                  │ sessionToken    │
        │                  │ expires    Date │
        │                  └─────────────────┘
        │
        │
┌───────▼─────────────────────────────────────────────────────┐
│                          Job                                 │
├──────────────────────────────────────────────────────────────┤
│ id             UUID                                          │
│ apecId         String (UNIQUE)                               │
│ title          String                                        │
│ description    String?                                       │
│ location       String?                                       │
│ contractType   String?                                       │
│ salary         String?                                       │
│ requirements   String?                                       │
│ benefits       String?                                       │
│ status         JobStatus (DRAFT/PUBLISHED/PAUSED/EXPIRED)   │
│ views          Int                                           │
│ applications   Int                                           │
│ publishedAt    Date?                                         │
│ lastSyncAt     Date?                                         │
│ deletedAt      Date? (soft delete)                           │
│ createdAt      Date                                          │
│ updatedAt      Date                                          │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     SyncHistory                              │
├─────────────────────────────────────────────────────────────┤
│ id              UUID                                         │
│ syncType        String (full/incremental)                    │
│ status          String (pending/success/error)               │
│ jobsCreated     Int                                          │
│ jobsUpdated     Int                                          │
│ jobsDeleted     Int                                          │
│ jobsUnchanged   Int                                          │
│ errors          String[]                                     │
│ startedAt       Date                                         │
│ completedAt     Date?                                        │
│ duration        Int? (milliseconds)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Report                                │
├─────────────────────────────────────────────────────────────┤
│ id              UUID                                         │
│ type            ReportType (DAILY/WEEKLY/MONTHLY/CUSTOM)    │
│ period          String                                       │
│ startDate       Date                                         │
│ endDate         Date                                         │
│ data            Json                                         │
│ generatedAt     Date                                         │
│ exportedAt      Date?                                        │
│ exportFormat    String?                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AuditLog                                │
├─────────────────────────────────────────────────────────────┤
│ id              UUID                                         │
│ action          String                                       │
│ entity          String                                       │
│ entityId        String?                                      │
│ userId          String?                                      │
│ changes         Json?                                        │
│ ipAddress       String?                                      │
│ userAgent       String?                                      │
│ createdAt       Date                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Composants UI Hierarchy

```
App
└── RootLayout
    ├── SessionProvider (Providers.tsx)
    └── AuthGuard (middleware.ts)
        │
        ├── Auth Pages (No layout)
        │   ├── LoginPage
        │   │   ├── Button
        │   │   ├── Input
        │   │   └── Form
        │   └── RegisterPage
        │       ├── Button
        │       ├── Input
        │       └── Form
        │
        └── Dashboard Pages (with DashboardLayout)
            ├── Sidebar
            │   └── Navigation Links
            ├── Header
            │   ├── User Menu
            │   └── Notifications
            │
            └── Page Content
                ├── DashboardPage (/)
                │   ├── StatsCards
                │   │   └── Card × 5
                │   ├── RecentJobs
                │   │   └── Card + JobList
                │   └── SyncHistory
                │       └── Card + HistoryList
                │
                ├── JobsPage (/jobs)
                │   ├── SearchBar (Input)
                │   ├── Filters (Select)
                │   ├── JobsList
                │   │   └── Card × N
                │   └── Pagination (Button)
                │
                ├── ReportsPage (/reports)
                │   ├── ReportCards × 3
                │   └── Charts (Recharts)
                │
                └── SettingsPage (/settings)
                    └── SettingsForms × 4
```

---

## 🔐 Middleware & Protection

```
Request
   │
   ▼
┌─────────────┐
│ middleware  │ Check auth status
└──────┬──────┘
       │
       ├── Not Authenticated?
       │   └── Public route? (login/register)
       │       ├── Yes → Allow
       │       └── No → Redirect /login
       │
       └── Authenticated?
           └── Auth route? (login/register)
               ├── Yes → Redirect /dashboard
               └── No → Allow + Check role
                   │
                   ├── Admin route?
                   │   ├── Is Admin? → Allow
                   │   └── Not Admin? → 403
                   │
                   └── Regular route → Allow
```

---

## 📊 API Routes Architecture

```
/api
├── /auth
│   ├── [...nextauth]
│   │   └── NextAuth Handler
│   │       ├── Credentials Provider
│   │       ├── JWT Strategy
│   │       └── Session Callbacks
│   │
│   └── /register
│       └── POST Handler
│           ├── Validate with Zod
│           ├── Hash password (bcrypt)
│           ├── Create user (Prisma)
│           └── Return success
│
├── /jobs
│   ├── GET /jobs
│   │   ├── Parse query params (page, status, search)
│   │   ├── Build WHERE clause
│   │   ├── Fetch with Prisma (paginated)
│   │   └── Return { data, pagination }
│   │
│   ├── POST /jobs
│   │   ├── Validate with Zod
│   │   ├── Check duplicate apecId
│   │   ├── Create job (Prisma)
│   │   └── Return job
│   │
│   ├── /jobs/[id]
│   │   ├── GET → Find job by ID
│   │   ├── PATCH → Update job
│   │   └── DELETE → Soft delete job
│   │
│   └── /jobs/sync
│       ├── POST → Trigger sync
│       │   ├── Check admin role
│       │   ├── Run ApecSyncService
│       │   └── Return stats
│       └── GET → Get sync status
│
└── /dashboard
    └── /stats
        └── GET → Aggregate stats
            ├── Count jobs by status
            ├── Sum views & applications
            ├── Fetch recent jobs
            ├── Fetch sync history
            └── Return all data
```

---

## 🚀 Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   CDN Edge   │   │   CDN Edge   │   │   CDN Edge   │
│   (Paris)    │   │  (New York)  │   │   (Tokyo)    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Vercel Serverless     │
              │  Functions (cdg1)      │
              └────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  Static      │ │   API    │ │   Server     │
│  Assets      │ │  Routes  │ │  Components  │
└──────────────┘ └────┬─────┘ └──────┬───────┘
                      │              │
                      └──────┬───────┘
                             │
                             ▼
              ┌────────────────────────┐
              │  Vercel Postgres       │
              │  (managed PostgreSQL)  │
              └────────────────────────┘
```

---

## 🔄 State Management

```
┌────────────────────────────────────────────────────────────┐
│                     State Architecture                      │
└────────────────────────────────────────────────────────────┘

Server State (Prisma)
├── User data
├── Jobs data
├── Reports data
└── Sync history

Client State (React)
├── UI state (loading, errors)
├── Form state (react-hook-form)
└── Session state (NextAuth)

No Redux/Zustand needed:
- Server Components = Server state
- Client Components = Local UI state
- NextAuth = Auth state
```

---

## 📦 Build & Bundle

```
npm run build
     │
     ├── TypeScript Compilation
     │   └── Type checking (strict mode)
     │
     ├── Prisma Generation
     │   └── Generate client from schema
     │
     ├── Next.js Build
     │   ├── Compile Server Components
     │   ├── Compile Client Components
     │   ├── Generate static pages
     │   ├── Optimize images
     │   └── Bundle JavaScript
     │
     └── Output
         ├── .next/server/ (SSR pages)
         ├── .next/static/ (Assets)
         └── .next/cache/ (Build cache)

Deploy to Vercel
     │
     ├── Upload build artifacts
     ├── Configure environment variables
     ├── Setup Postgres connection
     └── Deploy to edge network
```

---

## 🎯 Performance Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│                   Performance Strategy                       │
└─────────────────────────────────────────────────────────────┘

1. Server Components (default)
   ├── No JavaScript to client
   ├── Fetch data on server
   └── SEO-friendly HTML

2. Client Components (selective)
   ├── Interactive UI only
   ├── Use 'use client' directive
   └── Lazy load heavy components

3. Image Optimization
   ├── Next.js Image component
   ├── AVIF/WebP formats
   └── Responsive sizes

4. Code Splitting
   ├── Automatic by route
   ├── Dynamic imports
   └── Lazy load modals/charts

5. Caching
   ├── ISR (revalidate: 60s)
   ├── API route cache headers
   └── CDN edge caching

6. Database
   ├── Prisma connection pooling
   ├── Selective field queries
   └── Parallel queries (Promise.all)
```

---

## 🔧 Development Workflow

```
Developer
   │
   ├── 1. Clone repo
   ├── 2. npm install
   ├── 3. Configure .env.local
   ├── 4. npm run db:push
   └── 5. npm run dev
       │
       └── Hot Module Replacement
           ├── File change detected
           ├── Fast Refresh (React)
           └── Browser auto-reload

Commit
   │
   ├── Git push to main
   │
   └── Vercel Auto Deploy
       ├── Trigger build
       ├── Run tests (if configured)
       ├── Deploy to preview URL
       └── Production deploy (if main)
```

---

## 📊 Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring Stack                          │
└─────────────────────────────────────────────────────────────┘

Vercel Analytics (built-in)
├── Web Vitals (LCP, FID, CLS)
├── Real User Monitoring (RUM)
└── Page views & visitors

Winston Logging (app)
├── Info logs
├── Error logs
└── Sync logs

PostgreSQL Monitoring
├── Query performance
├── Connection pooling
└── Table sizes

Future: Sentry
├── Error tracking
├── Performance monitoring
└── User session replay
```

---

## ✅ Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                     │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network
├── Vercel Edge Network
├── DDoS protection
└── SSL/TLS certificates

Layer 2: Application
├── NextAuth authentication
├── JWT tokens (HttpOnly)
├── Middleware route protection
└── CORS configuration

Layer 3: API
├── Zod validation
├── Rate limiting (to implement)
├── SQL injection protection (Prisma)
└── XSS protection (React)

Layer 4: Data
├── Password hashing (bcrypt)
├── Environment variables (secrets)
├── Soft deletes
└── Audit logs

Layer 5: Headers
├── X-Frame-Options: DENY
├── X-Content-Type-Options: nosniff
├── Referrer-Policy
└── X-XSS-Protection
```

---

## 🎓 Best Practices Applied

### Code Quality
✅ TypeScript strict mode
✅ ESLint Next.js config
✅ Consistent naming conventions
✅ Component composition

### Performance
✅ Server Components by default
✅ Selective Client Components
✅ Image optimization
✅ Code splitting

### Security
✅ Authentication (NextAuth)
✅ Input validation (Zod)
✅ Secure headers
✅ Password hashing

### Maintainability
✅ Clear folder structure
✅ Separation of concerns
✅ Reusable components
✅ Comprehensive documentation

### Scalability
✅ Serverless architecture
✅ Database connection pooling
✅ Stateless API routes
✅ CDN distribution

---

**Version:** 2.0.0
**Date:** 24 octobre 2025
**Auteur:** APEC Job Manager Team
