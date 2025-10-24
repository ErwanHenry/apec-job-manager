# APEC Job Manager - Serverless Quick Start

**5-Minute Setup Guide for Developers**

---

## Prerequisites

- Node.js 18+
- Vercel account
- APEC company credentials

---

## Quick Setup (Local Development)

### 1. Install Dependencies

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# APEC Credentials
APEC_EMAIL=your-email@company.fr
APEC_PASSWORD=your-password

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your-32-byte-hex-key

# Database (auto-configured by Vercel)
DATABASE_URL=your-database-url
KV_URL=your-kv-url
```

### 3. Start Development Server

```bash
vercel dev
```

Visit: `http://localhost:3000`

---

## Key Endpoints

### Test Authentication

```bash
curl -X POST http://localhost:3000/api/apec/auth \
  -H "Content-Type: application/json" \
  -d '{"forceRefresh": true}'
```

### List Jobs

```bash
curl http://localhost:3000/api/jobs?limit=10
```

### Create Job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Job description here (min 50 chars)...",
    "location": "Paris",
    "contractType": "CDI"
  }'
```

### Manual Sync

```bash
curl -X POST http://localhost:3000/api/jobs/sync
```

### Dashboard Stats

```bash
curl http://localhost:3000/api/dashboard/stats
```

---

## Deploy to Production

### 1. Connect to Vercel

```bash
vercel link
```

### 2. Set Production Environment Variables

```bash
vercel env add APEC_EMAIL production
vercel env add APEC_PASSWORD production
vercel env add ENCRYPTION_KEY production
```

### 3. Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## Architecture at a Glance

```
API Routes (/api/*)
  ↓
APEC Service (lib/services/apecServiceServerless.ts)
  ↓
Puppeteer + @sparticuz/chromium
  ↓
APEC.FR Website

Data Storage:
- Vercel KV → Cookies (encrypted, 24h TTL)
- Vercel Postgres → Jobs, Sync History, Reports
- Vercel Blob → PDF/CSV Exports
```

---

## Key Files

| File | Purpose |
|------|---------|
| `/api/apec/auth.ts` | Test authentication |
| `/api/jobs/create.ts` | Create job posting |
| `/api/cron/sync-jobs.ts` | Scheduled sync (6h) |
| `/lib/services/apecServiceServerless.ts` | APEC automation |
| `/vercel.json` | Vercel configuration |

---

## Important Constraints

⏱️ **Timeout:** 60 seconds per function (Pro plan)
💾 **Memory:** Up to 3 GB for Puppeteer functions
🔄 **Stateless:** No persistent sessions between calls
📦 **Storage:** Ephemeral filesystem (use KV/Blob instead)

---

## Cron Jobs

Configured in `vercel.json`:

- **Sync Jobs:** Every 6 hours (`0 */6 * * *`)
- **Daily Report:** 8am daily (`0 8 * * *`)
- **Cleanup:** Sunday 2am (`0 2 * * 0`)

---

## Monitoring

### View Logs

```bash
vercel logs --follow
```

### View Cron Logs

```bash
vercel logs /api/cron/sync-jobs --follow
```

### Health Check

```bash
curl https://your-app.vercel.app/api/health
```

---

## Troubleshooting

### "Puppeteer timeout"

- **Cause:** Operation took > 60s
- **Solution:** Reduce batch size in sync jobs

### "AUTH_FAILED"

- **Cause:** Invalid credentials or cookies expired
- **Solution:** Check environment variables, clear KV cache

### "Connection pool exhausted"

- **Cause:** Too many database connections
- **Solution:** Ensure `prisma.$disconnect()` in all routes

### "Cron not running"

- **Cause:** Missing CRON_SECRET or incorrect schedule
- **Solution:** Check Vercel dashboard → Cron Jobs

---

## Next Steps

1. **Read Full Architecture:** `/docs/SERVERLESS_ARCHITECTURE.md`
2. **Migration Guide:** `/docs/MIGRATION_GUIDE.md`
3. **Implementation Summary:** `/docs/SERVERLESS_IMPLEMENTATION_SUMMARY.md`

---

## Support

- **Documentation:** `/docs` folder
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Logs:** `vercel logs --follow`

---

**Ready to deploy? Run:** `vercel --prod`
