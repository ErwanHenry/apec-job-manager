# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a multi-project development workspace containing several applications across different domains:

### Primary Projects

1. **graixl-public/** - Revolutionary AI ecosystem with hexagonal architecture for B2B prospection
2. **pan-bagnat-website/** - Next.js website for Pan Bagnat Niçois cultural promotion
3. **prospection-system/** - LinkedIn to CRM B2B prospection automation system
4. **personnal-coach/** - Max AI Coach with Claude Flow and mental health support
5. **traverse/** - AR tourism app for EuroVélo 3 (TRAVERSE heritage exploration)
6. **olive-tree-ecommerce/** - Claude Flow e-commerce for Mediterranean artisan store
7. **business-plan/** - ESN business plan simulator for IT consulting agencies (✅ Production)
8. **kyo-marketing-daily/** - Daily marketing suggestions automation system
9. **kyo-business-model/** - Business model dashboard with React + TypeScript + Recharts

### Secondary Projects (Kaspa Ecosystem)

- **blablakas/** - Decentralized carpooling on Kaspa blockchain
- **kyo-website/** - KYO lending protocol (DeFi on Kaspa)
- **kaspa-builders-directory/** - Platform to reward Kaspa ecosystem contributors
- **Kaspa-Toolkit/** - Deployment manager for 7 Kaspa Community Toolkit tools
- **kaspa-project/** - Kaspa ecosystem utilities and scripts
- Various other experimental and archived projects

Each major project is independently deployable (primarily to Vercel) with its own package.json and dependencies.

---

## Quick Project Selection Guide

When starting work, identify which project directory you need:

**AI/ML & Multi-Agent Systems:**
- B2B prospection automation → `graixl-public/`
- Mental health AI coach → `personnal-coach/`
- LinkedIn CRM automation → `prospection-system/`

**Web Applications:**
- French cultural website (Next.js + Prisma) → `pan-bagnat-website/`
- Mediterranean e-commerce (Next.js + i18n) → `olive-tree-ecommerce/`
- AR tourism app (WebXR) → `traverse/`

**Business & Consulting:**
- ESN business plan simulator → `business-plan/`
- KYO business model dashboard → `kyo-business-model/`

**Marketing & Automation:**
- Daily marketing automation → `kyo-marketing-daily/`
- Static Kyo website → `kyo-website/`

**Blockchain (Kaspa Ecosystem):**
- Decentralized carpooling → `blablakas/`
- KYO lending protocol website → `kyo-website/`
- Kaspa builders rewards platform → `kaspa-builders-directory/`
- Kaspa Community Toolkit manager → `Kaspa-Toolkit/`
- Kaspa utilities → `kaspa-project/`

---

## Project-Specific Commands

### graixl-public (AI Ecosystem)

```bash
cd ~/graixl-public

# Development
npm start                    # Launch ecosystem launcher
npm run dev                  # Development server
npm test                     # Run complete test suite (6 phases)

# Deployment
npm run build                # Prepare static files
npm run deploy               # Deploy to Vercel production
```

**Key Architecture:**
- Hexagonal architecture with 6 specialized AI engines
- 20+ AI agents organized in 5 teams
- Multi-agent coordination system
- Real-time analytics and predictions

**Main Entry Points:**
- `src/GraixlEcosystem.js` - Main orchestrator
- `src/EcosystemLauncher.js` - Simplified launcher interface
- `api/ecosystem.js` - Vercel serverless API

**Core Modules:**
- `src/core/agents/` - AI agent teams
- `src/core/intelligence/` - Predictive ML models
- `src/core/orchestrator/` - Multi-channel orchestration
- `src/core/analytics/` - Real-time metrics collection
- `src/core/workflows/` - Adaptive workflow engine

### pan-bagnat-website (Next.js)

```bash
cd ~/pan-bagnat-website

# Development
npm run dev                  # Start Next.js dev server (http://localhost:3000)

# Database
npm run db:generate          # Generate Prisma client
npm run db:push              # Push schema to database
npm run db:studio            # Open Prisma Studio GUI
npm run seed                 # Seed database with initial data

# Production
npm run build                # Build for production (includes Prisma generation)
npm start                    # Start production server
npm run prepare-prod         # Prepare production environment
```

**Tech Stack:**
- Next.js 14 with TypeScript and App Router
- Prisma ORM with SQLite database
- Tailwind CSS for styling
- React Quill for WYSIWYG editing
- NextAuth for authentication

**Key Architecture:**
- App Router structure in `src/app/`
- API routes in `src/app/api/`
- Shared components in `src/components/`
- Database schema: `prisma/schema.prisma`

**Database Models:**
- User (authentication, roles: ADMIN/EDITOR)
- BlogPost (content management with SEO)
- Event (calendar with categories)
- MediaFile (file uploads)
- Session (auth sessions)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in tsconfig.json)

### prospection-system (LinkedIn Automation)

```bash
cd ~/prospection-system

# Development
npm start                    # Start Express server (port 3000)
npm run dev                  # Development with nodemon

# Testing
npm test                     # Claude Flow integration tests
npm run test:claude-flow     # Claude Flow tests
npm run test:workflow        # Enhanced workflow tests
npm run test:simple          # Simple workflow tests

# Docker
npm run docker:build         # Build production Docker image
npm run docker:run           # Start with docker-compose
npm run docker:stop          # Stop containers
npm run docker:logs          # View container logs

# Legacy Backend (older architecture)
npm run legacy:start         # Start legacy backend server
npm run legacy:dev           # Legacy development mode

# Health & Monitoring
npm run health               # Check server health
npm run claude-flow:health   # Check Claude Flow system health
```

**Architecture:**
- Modern API in `api/` (main)
- Legacy backend in `backend/` (deprecated but functional)
- Frontend dashboard in `frontend/`
- Claude Flow integration in `testClaudeFlow/`

**Services (backend/services/):**
- `linkedinApollo.js` - Apollo.io API integration (primary)
- `googleSheets.js` - Google Sheets CRM integration
- `emailFinderService.js` - Email discovery
- `emailVerificationService.js` - Email validation
- `automationService.js` - Campaign automation

**Environment Variables:**
Critical `.env` configuration (never commit credentials):
- `PORT` - Server port (default 3000)
- `GOOGLE_SPREADSHEET_ID` - Target Google Sheets CRM
- `LINKEDIN_COOKIE` - LinkedIn authentication (see GET_LINKEDIN_COOKIE.md)
- `APOLLO_API_KEY` - Apollo.io API key
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` - Email automation
- `LINKEDIN_SCRAPER_TYPE` - Scraper selection (apollo recommended)

### personnal-coach (AI Mental Health Coach)

```bash
cd ~/personnal-coach

# Development
npm run dev                  # Start with ts-node-dev (hot reload)
npm start                    # Production mode

# Building
npm run build                # TypeScript compilation to dist/
npm run build:watch          # Watch mode for development

# Testing
npm test                     # Run Jest test suite
npm run test:watch           # Jest watch mode
npm run test:coverage        # Generate coverage report

# Code Quality
npm run lint                 # ESLint check
npm run lint:fix             # Auto-fix ESLint issues
npm run type-check           # TypeScript type checking

# Deployment
npm run vercel-build         # Vercel build command
npm run deploy               # Deploy to Vercel
npm run clean                # Clean dist directory
```

**Tech Stack:**
- TypeScript with strict mode
- Express backend with REST API
- Anthropic Claude AI SDK
- Hexagonal architecture + DDD + CQRS
- InversifyJS for dependency injection

**Architecture:**
- **Domain Layer** (`src/domain/`) - Entities, Value Objects, Domain Logic
  - `User.js` - Core user aggregate
  - `MoodScore.js`, `RiskLevel.js`, `PersonalityMode.js` - Value objects
- **Application Layer** (`src/application/`) - Use cases, Commands, Queries, Handlers
- **Claude Flow** (`src/claude-flow/`) - Multi-agent orchestration
  - 5 specialized agents: Orchestrator, Mood Analysis, Revenue Optimization, Intervention, Learning
  - 3 workflows: DailyCheckIn, RevenueOptimization, CrisisIntervention

**Key Features:**
- Mental health support with crisis detection (French emergency numbers: 3114, 15, 112)
- Adaptive AI personality that learns from interactions
- Revenue optimization coaching
- Gamification (XP, levels, badges, streaks)
- 10-minute daily limit to prevent dependency

### traverse (AR Tourism App)

```bash
cd ~/traverse

# Development
npm run dev                  # Vercel dev server
npm start                    # Same as dev
npm run build                # Echo build completion (static files)

# Database
npm run db:setup             # Vercel Postgres setup
npm run db:migrate           # Run migrations

# Testing
npm test                     # E2E production tests
npm run test:local           # Local integration tests

# Claude Flow
npm run claude-flow:init     # Initialize Claude Flow
npm run claude-flow:start    # Start agent system
npm run claude-flow:deploy   # Deploy with agents

# Deployment
npm run deploy               # Deploy to Vercel
npm run preview              # Preview deployment
```

**Tech Stack:**
- Vercel serverless (Postgres, KV, Blob storage)
- Claude Flow multi-agent system
- A-Frame + AR.js for WebXR
- PWA for mobile experience

**Claude Flow Agents:**
- WorkflowAgent - Orchestration
- ProductManagerAgent - Business logic
- BackendDeveloperAgent - API development
- GeolocationAgent - Location services
- UICoordinatorAgent - UI coordination
- ARCameraAgent - AR functionality

**Use Case:**
European tourism project for EuroVélo 3 cycle route, featuring QR code stations, AR overlays of industrial heritage sites, and geolocation-based content about glass-making history in Avesnois-Thiérache region.

### olive-tree-ecommerce (Claude Flow E-commerce)

```bash
cd ~/olive-tree-ecommerce

# Development
npm run dev                  # Next.js development server

# Claude Flow
npm run claude-flow:setup    # Initial setup script
npm run claude-flow:workflows # Configure workflows
npm run claude-flow:start    # Start agent orchestration
npm run claude-flow:status   # Check agent status
npm run claude-flow:stop     # Stop agents
npm run claude-flow:dev      # Concurrent dev + agents

# Workflows
npm run workflow:import      # Product import workflow
npm run workflow:localization # Content localization
npm run workflow:mediterranean # Mediterranean optimization

# Tools
npm run import:products      # Import product data
npm run optimize:images      # Optimize product images
npm run admin                # Open admin interface

# Hexagonal Architecture
npm run hexagonal:demo       # Architecture demo
npm run hexagonal:health     # Health check
npm run hexagonal:validate   # Validate architecture
npm run architecture:init    # Initialize hexagonal app
npm run test:architecture    # Test architecture

# Production
npm run build                # Next.js production build
npm start                    # Start production server
```

**Tech Stack:**
- Next.js 15 with React 19
- Tailwind CSS with Mediterranean theme
- i18next for multilingual (EN/FR/GR)
- Claude Flow official orchestration
- Stripe integration (planned)

**Claude Flow Architecture:**
7 specialized agents coordinating e-commerce operations:
- ProductManager (strategic decisions - "Queen")
- FrontendDeveloper (React/Next.js)
- BackendDeveloper (APIs, data)
- UXDesigner (conversion optimization)
- ContentManager (trilingual content)
- QualityAssurance (testing)
- DevOpsEngineer (deployment)

**Product Categories:**
Olive wood crafts, ceramics, textiles, jewelry, home decor from Paros, Greece.

### business-plan (ESN Business Simulator)

```bash
cd ~/business-plan

# Development
npm start                    # Start console simulation
npm run build                # Prepare static files

# Flow Nexus (Multi-Agent System)
npm run flow-nexus           # Start Flow Nexus server
npm run flow-nexus-init      # Initialize Flow Nexus agents
```

**Tech Stack:**
- Node.js with Express backend
- Vanilla JS + Chart.js for dashboard
- Joi validation library for input validation
- Flow Nexus multi-agent orchestration
- Vercel serverless deployment

**Architecture:**
- **Simulation Engine** (`src/`) - Financial and operational calculations
- **Validation Layer** (`src/validation/`) - Joi schemas for parameter validation
- **Cash Flow Calculator** (`src/CashFlowCalculator.js`) - Treasury forecasting with DSO/DPO
- **Agents** (`agents/`) - ProductManager, UXUIDesigner
- **API** (`api/`) - REST endpoints for simulations
- **Dashboard** - Web-based business metrics visualization
- **Config** (`config/`) - Business parameters (salaries, TJM, ratios)
- **Scenarios** (`scenarios/`) - Pessimistic, Realistic, Optimistic

**Key Features (Production-Ready):**
- ✅ Joi validation for all input parameters (29 test cases)
- ✅ Cash flow module with DSO 45 days, DPO 30 days
- ✅ Working Capital Requirement (BFR) calculation
- ✅ 3-level treasury alerts (critical/warning/ok)
- ✅ Capital recommendations with binary search algorithm
- ✅ Multi-scenario comparison

**Use Case:**
Performance simulation for French IT consulting agencies (ESN). Simulates revenue, margins, consultant utilization, and provides multi-scenario financial projections with PDF/Excel export capabilities. Now includes production-ready cash flow forecasting for bank/investor presentations.

**API Endpoints:**
- `/api/simulation/pessimiste` - Pessimistic scenario
- `/api/simulation/realiste` - Realistic scenario
- `/api/simulation/optimiste` - Optimistic scenario
- `/api/comparison` - Compare all 3 scenarios
- `/api/parameters` - Configuration parameters

**Key Metrics:**
- Annual revenue (CA): 1.5M€ - 4.2M€ depending on scenario
- Net margin: 2.1% - 31.4%
- Consultant count: 25-46
- Daily rate (TJM): ~650€
- Utilization rate: 81.6% - 98.5%
- Treasury forecast with DSO/DPO/BFR
- Break-even capital recommendations

**Production Deployment:**
URL: https://it-consuting-business-plan-bojfdjnum-erwan-henrys-projects.vercel.app
Latest commit: 7b073b1 (Validation Joi + Cash Flow Module)

### kyo-marketing-daily (Marketing Automation)

```bash
cd ~/kyo-marketing-daily

# Development
npm start                    # Start Express server

# Automation
npm run daily                # Run daily marketing task
```

**Simple Node.js service:**
- Express server for web interface
- node-cron for scheduled tasks
- Nodemailer for email delivery
- Daily automated marketing suggestions

### kyo-business-model (Business Model Dashboard)

```bash
cd ~/kyo-business-model

# Development
npm install                  # Install dependencies
npm run dev                  # Start Vite dev server (http://localhost:5173)

# Production
npm run build                # Build for production (TypeScript + Vite)
npm run preview              # Preview production build

# Code Quality
npm run lint                 # Run ESLint checks
```

**Tech Stack:**
- React 18 with TypeScript (strict mode)
- Vite for build tooling
- Recharts for data visualization
- Tailwind CSS for styling
- ESLint for code quality

**Architecture:**
- **Component Structure** (`src/components/`) - Dashboard, KPI cards, charts
- **Hooks** (`src/hooks/`) - Custom React hooks for state management
- **Types** (`src/types/`) - TypeScript interfaces and type definitions
- **Utils** (`src/utils/`) - Helper functions and formatters
- **Data Management** - useMemo for performance optimization

**Key Features:**
- 📊 **Multi-tab Navigation** - 3 views (Overview, Breakdown, Metrics)
- 💰 **KPI Cards** - Revenue, Profit, Users, Margin with gradient design
- 🥧 **Pie Charts** - Revenue vs. Costs breakdown with conditional labels (> 5%)
- 📈 **Line Charts** - 5-year evolution with trend analysis
- ⚡ **Performance Optimized** - Memoization with useMemo to prevent unnecessary re-renders
- 🎨 **Custom Components** - Enriched tooltips with currency formatting
- 📱 **Responsive Design** - Adaptive grid for mobile/tablet/desktop
- 🚫 **Empty State Handling** - Clear messages when no data available

**Use Case:**
Interactive business model dashboard for KYO financial projections. Displays yearly data for revenue streams (transaction fees, credit revenue, premium revenue, data revenue), cost breakdown (cashback, marketing, tech, operations), and key metrics evolution over 5 years.

**TypeScript Interfaces:**
```typescript
interface YearlyData {
  year: number;
  users: number;
  // Revenue streams
  transactionFees: number;
  creditRevenue: number;
  premiumRevenue: number;
  dataRevenue: number;
  totalRevenue: number;
  // Cost breakdown
  cashbackCosts: number;
  marketingCosts: number;
  techCosts: number;
  operationsCosts: number;
  totalCosts: number;
  // Metrics
  netProfit: number;
  margin: number;
}
```

**Performance Optimizations:**
- **useMemo** for filtering null values from chart data
- **Conditional labels** on pie charts (only show if segment > 5%)
- **Custom tooltips** with professional currency formatting (M€, K€)
- **Legend enrichment** with formatted values
- **Data memoization** to avoid recalculating on every render

**Next Steps:**
- [ ] Add Jest + React Testing Library for unit tests
- [ ] Implement PDF/Excel export functionality
- [ ] Add dark/light mode toggle
- [ ] Create interactive year filters
- [ ] Add animation transitions between tabs
- [ ] Implement mobile-first responsive enhancements

---

## Kaspa Ecosystem Projects

### blablakas (Decentralized Carpooling)

```bash
cd ~/blablakas

# Development
npm run dev                  # Live server on port 8080

# Deployment
npm run build                # Copy files to dist/
npm run deploy               # Deploy to Netlify
```

**Tech Stack:**
- Vanilla JavaScript (no framework)
- Supabase for backend
- Netlify deployment
- Kaspa blockchain integration (planned)

**Use Case:**
Decentralized carpooling platform (like BlaBlaCar) built on Kaspa blockchain. Users can offer/find rides with crypto payments.

**Structure:**
- `src/` - Source files
- `dist/` - Build output
- `kaspa-mcp-server/` - Kaspa MCP server integration
- `kaspa-official/` - Official Kaspa SDK

### kyo-website (Kaspa Lending Protocol)

```bash
cd ~/kyo-website

# No build process - static HTML site
# View locally with any HTTP server
python -m http.server 8080
# or
npx live-server
```

**Tech Stack:**
- Static HTML/CSS/JavaScript
- No build process required
- Vercel deployment

**Description:**
Marketing website for **KYO** - A DeFi lending protocol on Kaspa blockchain.

**Key Features:**
- "Don't spend your future to live your present"
- Deposit KAS as collateral
- Borrow instantly
- Pay in real time with KYO Card
- Built on Kaspa blockchain

**Pages:**
- `index.html` - Landing page
- `how-it-works.html` - Product explanation
- `roadmap.html` - Development roadmap
- `why-kaspa.html` - Kaspa advantages

**Deployment:** https://kyo-website.vercel.app

### kaspa-builders-directory (Builders Rewards Platform)

```bash
cd ~/kaspa-builders-directory

# Development
npm run dev                  # Nodemon development server
npm start                    # Production server

# Testing & Quality
npm test                     # Jest test suite
npm run lint                 # ESLint code quality
```

**Tech Stack:**
- Node.js + Express backend
- Vanilla JavaScript frontend
- PostgreSQL (planned)
- Redis cache (planned)
- Kaspa WASM SDK
- Kasplex KRC-20 smart contracts

**Features:**
- 🔐 Wallet integration for voting/donations
- 🗳️ Community-driven builder recognition
- 💰 Direct KAS donations to builders
- 🪙 Automated KRC-20 token rewards
- 🤖 GitHub scraping for builder discovery
- 📊 Admin dashboard

**Structure:**
- `index.html` - Main frontend
- `admin.html` - Admin dashboard
- `src/server.js` - Express server
- `src/routes/` - API routes
- `src/services/` - Business logic

### Kaspa-Toolkit (KCT Deployment Manager)

```bash
cd ~/Kaspa-Toolkit

# Development
npm run dev                  # Start server on port 3001
npm start                    # Production mode
```

**Tech Stack:**
- Node.js + Express backend
- Socket.io for real-time updates
- Moment.js with Europe/Paris timezone
- Vanilla JS frontend
- node-cron for scheduling

**Purpose:**
Deployment manager for **Kaspa Community Toolkit (KCT)** - supervises 7 tools with critical deadlines.

**7 KCT Tools Managed:**
1. **BlablaKAS** - Decentralized carpooling
2. **KAScomodation** - Community hosting
3. **PeerMap** - Member/merchant mapping
4. **Kaspa Deals** - Classified ads
5. **KasMiners** - Mining guides and tools
6. **KCT Rewards** - Rewards system
7. **KASvote** - Decentralized voting

**Critical Milestones:**
- **31 Aug 2025, 23:59 CET** - Tech readiness freeze
- **13 Sep 2025, 10:00 CET** - The Kaspa Experience (Berlin launch)
- **10 Nov 2025, 23:59 CET** - Full KCT delivery

**Features:**
- Real-time dashboard with WebSocket updates
- Progress tracking (0-100%) for each tool
- Milestone countdowns with timezone handling
- Urgent alerts based on deadlines
- Deployment triggers and logging
- Now/Next/Later roadmap view

**API Endpoints:**
- `GET /api/status` - Global KCT status
- `POST /api/tools/:id/progress` - Update progress
- `POST /api/deploy/:id` - Trigger deployment

---

## Kaspa Ecosystem Overview

The workspace contains a comprehensive **Kaspa blockchain ecosystem** with multiple interconnected projects:

### Core Projects
- **kyo-website** - DeFi lending protocol for Kaspa (borrow against KAS collateral)
- **blablakas** - Decentralized carpooling with crypto payments
- **kaspa-builders-directory** - Community platform to reward ecosystem contributors

### Tooling & Infrastructure
- **Kaspa-Toolkit** - Deployment manager supervising 7 KCT tools with milestone tracking
- **kaspa-project** - Utilities and scripts for Kaspa development

### Planned KCT Tools (managed by Kaspa-Toolkit)
1. BlablaKAS - Carpooling
2. KAScomodation - Hosting
3. PeerMap - Mapping
4. Kaspa Deals - Classifieds
5. KasMiners - Mining tools
6. KCT Rewards - Rewards system
7. KASvote - Voting platform

### Key Technologies
- Kaspa WASM SDK for blockchain interaction
- Kasplex KRC-20 for smart contracts
- Wallet integrations (voting, donations, payments)
- Real-time progress tracking and deployment automation

### Important Dates (Berlin Launch)
- **31 Aug 2025** - Tech readiness freeze
- **13 Sep 2025** - The Kaspa Experience (Berlin)
- **10 Nov 2025** - Full KCT delivery

---

## Common Patterns Across Projects

### Vercel Deployment
Most projects use Vercel for deployment:
- Each has a `vercel.json` configuration
- Environment variables configured in Vercel dashboard
- Automatic deployments on git push
- Regional deployment: `cdg1` (Paris region)

### Claude Flow Multi-Agent Architecture
Many projects use multi-agent orchestration systems:
- **graixl-public** - 6 AI engines with 20+ agents (hexagonal architecture)
- **personnal-coach** - 5 Claude Flow agents with 3 workflows (mental health + revenue optimization)
- **traverse** - 6 Claude Flow agents for AR tourism (geolocation + camera + UI)
- **olive-tree-ecommerce** - 7 Claude Flow agents for e-commerce (product management + UX)
- **business-plan** - Flow Nexus agents (ProductManager + UXUIDesigner) for business simulation
- **prospection-system** - Multi-agent LinkedIn automation

Common patterns:
- Agent coordination and orchestration via event-driven architecture
- Workflow-based task execution
- Real-time analytics and metrics collection
- Adaptive learning and personalization
- Different frameworks: Claude Flow (official) and Flow Nexus

### Security & Authentication
- **Never commit** `.env` files or credentials
- LinkedIn cookies expire and need refresh (see project-specific guides)
- Google OAuth requires `credentials.json` (not in repo)
- API keys stored in environment variables only

---

## Testing Guidelines

### graixl-public
Run `npm test` which executes 6 validation phases:
1. Initialization tests
2. AI engine tests
3. Cross-engine coordination
4. Intelligent operations
5. Performance metrics
6. Resilience tests

### personnal-coach
Full Jest test suite with TypeScript:
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report
- `npm run type-check` - TypeScript validation

### pan-bagnat-website
No test suite currently. Manual testing workflow:
1. Run `npm run dev`
2. Test admin interface at `/admin`
3. Verify database with `npm run db:studio`
4. Check build with `npm run build`

### kyo-business-model
No test suite currently (planned: Jest + React Testing Library). Manual testing workflow:
1. Run `npm run dev`
2. Test all 3 tabs (Overview, Breakdown, Metrics)
3. Verify chart responsiveness on different viewports
4. Test currency formatting and tooltip behavior
5. Check build with `npm run build`
6. Preview production build with `npm run preview`

### prospection-system
Multiple test suites available:
- Integration tests: `npm test`
- Workflow tests: `npm run test:workflow`
- Simple tests: `npm run test:simple`
- Health checks: `npm run health`

### traverse
E2E and integration tests:
- `npm test` - Production E2E tests
- `npm run test:local` - Local integration tests

### olive-tree-ecommerce
Architecture validation:
- `npm run test:architecture` - Hexagonal architecture tests
- `npm run hexagonal:validate` - Architecture validation
- `npm run hexagonal:health` - System health check

### kaspa-builders-directory
Jest and ESLint:
- `npm test` - Run Jest test suite
- `npm run lint` - ESLint code quality check

### Kaspa Ecosystem Projects
Most Kaspa projects (blablakas, kyo-website) are static sites with manual testing:
1. Run local server
2. Test UI interactions
3. Verify blockchain integration (if applicable)
4. Check deployment builds

---

## Development Workflow

### Starting Fresh
```bash
# Choose your project
cd ~/[graixl-public|pan-bagnat-website|prospection-system]

# Install dependencies
npm install

# For pan-bagnat-website only: setup database
npm run db:generate && npm run db:push

# Start development
npm run dev  # or npm start
```

### Database Changes (pan-bagnat-website)
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to apply changes
3. Restart dev server if needed
4. Use `npm run db:studio` to inspect data

### API Development (prospection-system)
- Main API: `api/` directory (preferred)
- Legacy API: `backend/` directory (deprecated)
- Test endpoints with `npm run health`
- Monitor with `npm run docker:logs` if using Docker

---

## Architecture Notes

### graixl-public: Hexagonal Architecture
Uses Ports & Adapters pattern with clear separation:
- **Domain** (`src/core/domain/`) - Business logic
- **Ports** (`src/core/ports/`) - Interfaces
- **Adapters** (`src/adapters/`) - External integrations
- **Core Engines** - Intelligence, Analytics, Orchestration, Recommendations, Workflows, Agents

6 AI Engines coordinated via event-driven architecture with 90%+ collaboration index.

### pan-bagnat-website: Next.js App Router
- Server components by default
- Client components marked with `'use client'`
- API routes follow REST conventions
- Prisma for type-safe database access
- Image optimization via Next.js Image component

### prospection-system: Service-Oriented
- Express backend with service layer
- Multiple scraping strategies (Apollo preferred)
- Google Sheets as simple CRM
- LinkedIn automation with multiple fallbacks
- Email finder and verification pipeline

---

## Common Issues & Solutions

### "LinkedIn cookie expired"
See `prospection-system/GET_LINKEDIN_COOKIE.md` for refresh instructions.

### "Prisma Client not generated"
Run `npm run db:generate` in pan-bagnat-website.

### "Port 3000 already in use"
Multiple projects use port 3000. Stop others or change PORT in .env.

### "Module not found" errors
Run `npm install` in the specific project directory.

### Vercel build failures
Check:
1. `vercel.json` configuration
2. Environment variables in Vercel dashboard
3. Build command in package.json
4. Node version compatibility (use Node 18+)

---

## Documentation References

### graixl-public
- `ECOSYSTEM_QUICK_START.md` - Quick start guide
- `DOCUMENTATION_TECHNIQUE.md` - Technical details
- `HEXAGONAL_ARCHITECTURE.md` - Architecture guide

### pan-bagnat-website
- `DEPLOYMENT.md` - Deployment instructions
- `VERCEL_RESOLUTION_SUMMARY.md` - Vercel setup
- `CLAUDE_FLOW_GUIDE.md` - AI agent configuration

### prospection-system
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE_GUIDE.md` - System architecture
- `AUTOMATION_GUIDE.md` - Automation setup
- `CLAUDE_FLOW_GUIDE.md` - Multi-agent setup
- `DEPLOYMENT_GUIDE.md` - Production deployment

### business-plan
- `GUIDE_UTILISATION.md` - User guide (French)
- `VERCEL_DEPLOYMENT.md` - Deployment instructions
- `INTEGRATION_FLOW_NEXUS.md` - Flow Nexus integration
- `CHECKUP-SUMMARY.md` - System checkup summary

---

## Technology Stack Summary

**Languages & Frameworks:**
- JavaScript/Node.js 18+ (most projects)
- TypeScript (personnal-coach, pan-bagnat-website)
- Next.js 14-15 (pan-bagnat-website, olive-tree-ecommerce)
- Express.js (prospection-system, personnal-coach, kyo-marketing-daily)
- A-Frame + AR.js (traverse - WebXR)

**Databases:**
- SQLite + Prisma ORM (pan-bagnat-website)
- Vercel Postgres (traverse, kaspa-builders-directory planned)
- Vercel KV + Blob Storage (traverse)
- Google Sheets (prospection-system)
- Supabase (blablakas)
- Redis cache (kaspa-builders-directory planned)

**AI & Multi-Agent Systems:**
- Claude Flow official orchestration (personnal-coach, traverse, olive-tree-ecommerce)
- Flow Nexus orchestration (business-plan)
- Anthropic Claude AI SDK (personnal-coach)
- Custom ML prediction models (graixl-public)
- Hexagonal architecture + DDD + CQRS patterns

**Architecture Patterns:**
- Hexagonal Architecture (graixl-public, personnal-coach, olive-tree-ecommerce)
- Domain-Driven Design (personnal-coach)
- CQRS + Event Sourcing (personnal-coach)
- Multi-agent orchestration (all Claude Flow projects)
- Dependency Injection (InversifyJS in personnal-coach)

**Web Scraping & Automation:**
- Puppeteer, Playwright, Selenium
- Apollo.io API integration
- LinkedIn automation with multiple strategies

**Deployment & Infrastructure:**
- Vercel serverless (primary platform for most projects)
- Netlify (blablakas)
- Docker (prospection-system)
- PWA capabilities (traverse)
- Git for version control
- Static hosting for Kaspa ecosystem sites

**UI & Styling:**
- React 18-19
- Tailwind CSS (pan-bagnat-website, olive-tree-ecommerce)
- Headless UI, Heroicons
- React Quill (WYSIWYG editing)
- i18next (internationalization - olive-tree-ecommerce)

**Security & Auth:**
- BCrypt, JWT, NextAuth
- Helmet (security headers)
- Rate limiting (rate-limiter-flexible)
- GDPR compliance (personnal-coach)

**Developer Experience:**
- TypeScript strict mode
- ESLint + Prettier
- Jest testing framework
- ts-node-dev for hot reload
- Concurrent dev servers

**Blockchain & Web3:**
- Kaspa blockchain integration
- Kaspa WASM SDK
- Kasplex KRC-20 smart contracts
- Wallet integrations (voting, donations)

**Integrations:**
- Googleapis (Sheets, Calendar)
- Nodemailer (email automation)
- Stripe (planned - olive-tree-ecommerce)
- Geolocation API (traverse)
- WebXR APIs (traverse)
- Supabase (blablakas backend)
- Socket.io (real-time updates - Kaspa-Toolkit)
