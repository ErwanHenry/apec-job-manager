# 📸 Context Snapshot - securOrdo Project
**Last Updated:** January 15, 2026, 11:58 CET
**Status:** Sprint 2 Complete - Ready for Sprint 3

---

## 🎯 Project Overview

**Project Name:** MUSIC - Medical Universal Secure Identification Code
**Description:** Web application for generating and verifying encrypted QR codes for medical prescriptions with anti-fraud detection
**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL, @noble/crypto

**Repository:** `/Users/erwanhenry/claude-projects/securOrdo/`
**Git Status:** On main branch, all changes committed

---

## ✅ Completed Work

### Sprint 1: Infrastructure ✅
- Next.js 14.1.3 project initialized
- TypeScript configured (strict mode)
- Tailwind CSS with medical theme (blue, green, orange, red)
- 50 npm packages installed
- CI/CD pipelines created (GitHub Actions)
- Git Flow documentation with branch strategy
- Hexagonal architecture documented
- 8+ documentation files created
- Directory structure for domain/application/infrastructure
- Landing page working on localhost:3000
- Build test: PASSED ✅

### Sprint 2: Database & Models ✅
**Phase 1 Complete:**
- 11 database tables designed (PostgreSQL)
- 47 database indexes
- 11 enum types
- 20+ foreign key relationships
- Drizzle ORM schema (780 lines)
- Type-safe client with connection pooling
- Seed script with 32 test entities
- 5 domain repository interfaces (hexagonal architecture)
- Database setup documentation (600+ lines)
- TypeScript compilation: PASSED ✅
- Next.js build: PASSED ✅

---

## 📊 Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| establishments | Clinics & pharmacies | FINESSE, SIRET, crypto keys |
| users | Healthcare professionals | RPPS, email, roles, keys |
| patients | Medical patients | INS (unique), identity |
| prescriptions | Medical orders | Number, nonce, signature |
| prescription_items | Medications | CIS code, dosage, posology |
| dispensations | Pharmacy deliveries | Verification flags |
| dispensation_items | Delivery details | Quantities, substitutions |
| audit_logs | Compliance trail | Actions, changes (JSONB) |
| medications | BDPM database | CIS code, DCI, dosage |
| fraud_alerts | Anti-fraud system | Type, severity, status |
| nonce_records | Anti-replay tokens | Nonce, TTL, used_at |

---

## 🗂️ Critical Files

### Configuration
- `package.json` - Dependencies + 6 db scripts
- `tsconfig.json` - TypeScript strict mode
- `tailwind.config.js` - Medical theme colors
- `next.config.js` - Next.js settings
- `drizzle.config.ts` - Drizzle ORM config
- `.env.example` - Environment template

### Database
- `src/lib/db/schema.ts` (780 lines) - **Complete database schema**
- `src/lib/db/client.ts` - PostgreSQL connection pooling
- `src/lib/db/seed.ts` (415 lines) - Test data generator
- `drizzle/migrations/` - Migration directory (empty, ready for db:generate)

### Domain Layer (Hexagonal)
- `src/domain/repositories/patient-repository.ts`
- `src/domain/repositories/prescription-repository.ts`
- `src/domain/repositories/dispensation-repository.ts`
- `src/domain/repositories/user-repository.ts`
- `src/domain/repositories/nonce-repository.ts`

### Application
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Landing page (working)
- `src/app/globals.css` - Global styles
- `src/lib/utils.ts` - 10 utility functions

### Documentation
- `README.md` - Project overview
- `SETUP.md` - Quick start guide
- `GIT_FLOW.md` - Branching strategy
- `HEXAGONAL_ARCHITECTURE.md` - Architecture guide
- `docs/DATABASE_SETUP.md` - Database guide (600+ lines)
- `QUICK_REFERENCE.md` - Command reference
- `STATUS.txt` - Project status
- `PROJECT_INITIALIZATION.md` - Sprint 1 report
- `SPRINT_2_ROADMAP.md` - Sprint 2 planning
- `SPRINT_2_PROGRESS.md` - Progress tracking
- `SPRINT_2_COMPLETE.md` - Delivery summary
- `CONTEXT_SNAPSHOT.md` - This file

### CI/CD
- `.github/workflows/ci.yml` - Lint, type-check, build, security
- `.github/workflows/deploy.yml` - Production deployment

---

## 🚀 How to Get Back to Speed

### 1. Start Development Server
```bash
cd /Users/erwanhenry/claude-projects/securOrdo
npm run dev
# Server at http://localhost:3000
```

### 2. Setup Database (if not done)
```bash
# Create PostgreSQL database
createdb music_db

# Update .env.local
cp .env.example .env.local
# Edit: DATABASE_URL=postgresql://user:pass@localhost:5432/music_db

# Generate migrations & apply schema
npm run db:generate
npm run db:push

# Seed test data
npm run db:seed

# Explore with Drizzle Studio
npm run db:studio
```

### 3. Verify Everything
```bash
npm run type-check    # TypeScript check
npm run lint          # ESLint check
npm run build         # Production build
```

---

## 📋 Test Credentials (After db:seed)

```
Prescriber 1: jean.martin@cabinet-cardio.fr / prescriber1
Prescriber 2: marie.dupont@cabinet-cardio.fr / prescriber2
Pharmacist 1: pierre.bernard@pharmacie-marais.fr / pharmacist1
Pharmacist 2: sophie.lefebvre@pharmacie-marais.fr / pharmacist2
Admin:        admin@music.local / admin123
```

---

## 🎯 What's Next (Sprint 3)

### Sprint 3: Cryptographic Layer (2 weeks)

**Repository Implementation (Phase 2 & 3 deferred):**
- [ ] PatientRepository PostgreSQL adapter
- [ ] PrescriptionRepository adapter
- [ ] DispensationRepository adapter
- [ ] UserRepository adapter
- [ ] NonceRepository adapter
- [ ] DTO/Mapper implementations
- [ ] Zod validation schemas
- [ ] Integration tests

**Cryptographic Layer (Sprint 3):**
- [ ] ECDSA P-256 signature module (`src/lib/crypto/signature.ts`)
- [ ] ECIES hybrid encryption (`src/lib/crypto/encryption.ts`)
- [ ] CBOR serialization (`src/lib/crypto/qr-payload.ts`)
- [ ] QR code generation (`src/lib/crypto/qr-generator.ts`)
- [ ] QR code scanning (`src/lib/crypto/qr-scanner.ts`)
- [ ] Base45 encoding (`src/lib/crypto/base45.ts`)
- [ ] Nonce anti-replay service (`src/lib/services/nonce-service.ts`)
- [ ] Unit tests (100% coverage for crypto)

---

## 📊 Project Statistics

| Category | Count |
|----------|-------|
| Database tables | 11 |
| Database indexes | 47 |
| Enum types | 11 |
| Foreign keys | 20+ |
| Type exports | 32 |
| npm dependencies | 38 |
| npm devDependencies | 12 |
| Documentation files | 14 |
| Code files | 20+ |
| Lines of code (schema) | 780 |
| Lines of code (seed) | 415 |
| Test entities | 32 |

---

## 🔒 Security Implemented

✅ Unique constraints on INS, RPPS, nonce
✅ Immutable audit logs
✅ Encrypted payload support
✅ Nonce anti-replay structure
✅ Fraud alert detection system
✅ GDPR-compliant design
✅ TypeScript strict mode
✅ ESLint + Prettier configured

---

## 🛠️ Common Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build             # Build for production
npm run start             # Start prod server
npm run type-check        # TypeScript validation
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues

# Database
npm run db:generate       # Schema → migrations
npm run db:migrate        # Run migrations
npm run db:push           # Apply schema directly (dev)
npm run db:studio         # Visual Drizzle Studio
npm run db:seed           # Populate test data
npm run keys:generate     # Generate crypto keys (future)

# Git Flow
git checkout develop
git checkout -b feature/feature-name
# Make changes
git add .
git commit -m "feat(scope): description"
git push origin feature/feature-name
# Create PR on GitHub
```

---

## 📁 Directory Structure

```
securOrdo/
├── src/
│   ├── app/                    # Next.js pages & routes
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing page (working)
│   │   ├── globals.css
│   │   └── api/                # API routes (not yet)
│   ├── components/             # React components (not yet)
│   ├── domain/                 # Business logic (hexagonal)
│   │   ├── entities/
│   │   ├── repositories/       # 5 interfaces ✅
│   │   ├── services/
│   │   └── value-objects/
│   ├── application/            # Use cases & commands (not yet)
│   ├── infrastructure/         # DB adapters (not yet)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts       # ✅ Complete schema
│   │   │   ├── client.ts       # ✅ DB client
│   │   │   └── seed.ts         # ✅ Seed script
│   │   ├── crypto/             # ⏳ Next sprint
│   │   ├── utils.ts
│   │   └── validators/         # ⏳ Phase 2
│   └── types/
├── drizzle/
│   └── migrations/             # Ready for db:generate
├── docs/
│   └── DATABASE_SETUP.md       # ✅ 600+ lines
├── scripts/                    # ⏳ Not yet created
├── tests/                      # ⏳ Not yet created
├── public/
├── .github/
│   └── workflows/
│       ├── ci.yml              # ✅ CI pipeline
│       └── deploy.yml          # ✅ Deploy pipeline
├── .env.example                # ✅ Template
├── .gitignore                  # ✅ Configured
├── package.json                # ✅ Updated
├── tsconfig.json               # ✅ Strict mode
├── tailwind.config.js          # ✅ Medical theme
├── postcss.config.js           # ✅ PostCSS setup
├── next.config.js              # ✅ Next.js config
├── drizzle.config.ts           # ✅ Drizzle config
├── README.md                   # ✅ Full overview
├── SETUP.md                    # ✅ Quick start
├── QUICK_REFERENCE.md          # ✅ Commands
├── GIT_FLOW.md                 # ✅ Branching
├── HEXAGONAL_ARCHITECTURE.md   # ✅ Architecture
├── PROJECT_INITIALIZATION.md   # ✅ Sprint 1 report
├── SPRINT_2_ROADMAP.md         # ✅ Planning
├── SPRINT_2_PROGRESS.md        # ✅ Progress
├── SPRINT_2_COMPLETE.md        # ✅ Delivery
├── STATUS.txt                  # ✅ Status
└── CONTEXT_SNAPSHOT.md         # ✅ This file
```

Legend: ✅ Complete | ⏳ Not yet | 📝 In progress

---

## 🔄 Current State Summary

**What's Working:**
- ✅ Next.js 15 development server
- ✅ TypeScript compilation
- ✅ Tailwind CSS medical theme
- ✅ Landing page at localhost:3000
- ✅ Database schema designed
- ✅ Hexagonal architecture structure
- ✅ CI/CD pipelines ready
- ✅ Git Flow setup

**What's Pending:**
- ⏳ Database repositories (PostgreSQL adapters)
- ⏳ Cryptographic layer (ECDSA, ECIES, QR)
- ⏳ API backend (Hono routes)
- ⏳ UI components (prescriber, pharmacist)
- ⏳ Anti-fraud detection algorithms
- ⏳ Tests and integration

**What's Blocked:**
- Nothing - ready to proceed with Sprint 3

---

## 📞 Quick Reference

**Working Directory:** `/Users/erwanhenry/claude-projects/securOrdo/`
**Git Branch:** `main` (ready for feature branches)
**Node Version:** 18+ (required)
**Database:** PostgreSQL 14+ (required for db:seed)
**Package Manager:** npm (in use)

**Documentation to Read:**
1. Start: `SETUP.md` (5 minutes)
2. Architecture: `HEXAGONAL_ARCHITECTURE.md`
3. Database: `docs/DATABASE_SETUP.md`
4. Git: `GIT_FLOW.md`
5. Full Overview: `README.md`

---

## 🎓 Key Decisions Made

1. **Framework:** Next.js 15 (with App Router)
2. **ORM:** Drizzle ORM (type-safe, edge-compatible)
3. **Database:** PostgreSQL (robust, secure)
4. **Crypto:** @noble/curves, @noble/hashes (audited, zero-dependency)
5. **Architecture:** Hexagonal (testable, maintainable)
6. **Git Strategy:** Git Flow (main/develop, feature branches)
7. **Deployment:** Vercel (dev), HDS-certified (production)
8. **CI/CD:** GitHub Actions (lint, type-check, build, security)

---

## ⚠️ Important Notes

1. **Database Required:** Must run `npm run db:seed` before testing
2. **Environment:** Create `.env.local` from `.env.example`
3. **Type Safety:** All code uses TypeScript strict mode
4. **No Secrets:** Never commit `.env.local` or crypto keys
5. **Build Required:** Always run `npm run build` before deployment
6. **Git Flow:** Use feature branches, never push directly to main

---

## 🚀 When You Return

1. Read this file (2 minutes)
2. Check `SETUP.md` for latest changes
3. Run `npm install` (if needed)
4. Run `npm run dev` to start development
5. Read the sprint you're continuing (Sprint 3 roadmap TBD)
6. Start with next task

---

**Next Developer Notes:**
- Schema is production-ready and type-safe
- All configuration is centralized
- Documentation is comprehensive
- Repository interfaces defined and ready for implementation
- No blocking issues - can proceed directly to Sprint 3

---

**Generated:** January 15, 2026, 11:58 CET
**Status:** ✅ READY FOR SPRINT 3
**Estimated Next Review:** After repository implementations complete
