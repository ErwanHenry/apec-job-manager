# Migration Guide: Monolith to Serverless

This guide walks through migrating the APEC Job Manager from a monolithic Express server to Vercel's serverless architecture.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Environment Setup](#step-1-environment-setup)
3. [Step 2: Database Migration](#step-2-database-migration)
4. [Step 3: Install Serverless Dependencies](#step-3-install-serverless-dependencies)
5. [Step 4: Migrate Services](#step-4-migrate-services)
6. [Step 5: Create API Routes](#step-5-create-api-routes)
7. [Step 6: Configure Cron Jobs](#step-6-configure-cron-jobs)
8. [Step 7: Test Locally](#step-7-test-locally)
9. [Step 8: Deploy to Vercel](#step-8-deploy-to-vercel)
10. [Step 9: Verify Production](#step-9-verify-production)
11. [Rollback Plan](#rollback-plan)

---

## Prerequisites

- Node.js 18+ installed
- Vercel account (free or Pro)
- GitHub repository connected to Vercel
- APEC company account credentials
- PostgreSQL database access

---

## Step 1: Environment Setup

### 1.1 Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 1.2 Link Project to Vercel

```bash
cd /Users/erwanhenry/claude-projects/apec-job-manager
vercel link
```

Follow the prompts to link your project.

### 1.3 Enable Vercel Services

**Via Vercel Dashboard:**

1. Navigate to your project
2. Go to **Storage** tab
3. Enable:
   - Vercel Postgres (Neon)
   - Vercel KV (Upstash Redis)
   - Vercel Blob Storage

### 1.4 Set Environment Variables

**Generate encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Add to Vercel:**

```bash
# Production environment
vercel env add APEC_EMAIL production
# Enter: your-apec@company.fr

vercel env add APEC_PASSWORD production
# Enter: your-apec-password

vercel env add ENCRYPTION_KEY production
# Enter: <generated-hex-key-from-above>

vercel env add CRON_SECRET production
# Enter: <random-string-for-cron-auth>

vercel env add JWT_SECRET production
# Enter: <random-string-for-jwt>

# Database URLs are auto-configured by Vercel
```

**For development (optional):**

```bash
vercel env add APEC_EMAIL development
vercel env add APEC_PASSWORD development
vercel env add ENCRYPTION_KEY development
```

**Pull environment variables locally:**

```bash
vercel env pull .env.local
```

---

## Step 2: Database Migration

### 2.1 Update Prisma Schema for Serverless

Add to `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

### 2.2 Install Neon Adapter

```bash
npm install @prisma/adapter-neon @neondatabase/serverless
```

### 2.3 Create Migration Client

Create `lib/db/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({ adapter });
```

### 2.4 Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Vercel Postgres
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### 2.5 Verify Database

```bash
npx prisma studio
```

---

## Step 3: Install Serverless Dependencies

### 3.1 Replace package.json

Replace existing `package.json` with serverless version:

```bash
mv package.json package.json.backup
mv package.json.serverless package.json
```

### 3.2 Install Dependencies

```bash
npm install
```

**Key dependencies:**
- `@sparticuz/chromium` - Optimized Chromium for serverless
- `puppeteer-core` - Headless browser control
- `@vercel/kv` - Redis-compatible key-value store
- `@vercel/blob` - Object storage
- `@prisma/adapter-neon` - PostgreSQL adapter for serverless

---

## Step 4: Migrate Services

### 4.1 Review Existing Service

The original `src/services/apecService.js` maintains persistent browser sessions, which is incompatible with serverless.

**Original issues:**
- Long-running browser instance
- Singleton pattern with state
- No timeout handling
- Synchronous operations

### 4.2 Use Serverless Service

The new `lib/services/apecServiceServerless.ts` addresses these issues:

**Key changes:**
- Ephemeral browser per request
- Cookie persistence in KV
- Timeout-aware operations (55s limit)
- Graceful degradation
- Automatic cleanup

**No action needed** - service already created in previous step.

---

## Step 5: Create API Routes

Vercel uses file-based routing. Each file in `/api` becomes an endpoint.

### 5.1 Job Management Routes

**Create `/api/jobs/index.ts`** (GET /api/jobs):

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/db/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limit = '50', offset = '0', status } = req.query;

  try {
    const jobs = await prisma.job.findMany({
      where: status ? { status: status as string } : undefined,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { publishedAt: 'desc' },
    });

    const total = await prisma.job.count({
      where: status ? { status: status as string } : undefined,
    });

    return res.status(200).json({
      success: true,
      data: { jobs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
    });
  } catch (error) {
    console.error('[API:Jobs] Failed to fetch jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  } finally {
    await prisma.$disconnect();
  }
}
```

**Create `/api/jobs/create.ts`** (POST /api/jobs):

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../lib/db/prisma';
import { apecService } from '../../lib/services/apecServiceServerless';
import Joi from 'joi';

const jobSchema = Joi.object({
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().min(50).max(5000).required(),
  location: Joi.string().required(),
  contractType: Joi.string().valid('CDI', 'CDD', 'Freelance', 'Stage').required(),
  salary: Joi.string().optional(),
  experienceLevel: Joi.string().valid('junior', 'intermediate', 'senior').optional(),
  skills: Joi.array().items(Joi.string()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  const { error, value } = jobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid job data',
        details: error.details.map((d) => ({ field: d.path[0], message: d.message })),
      },
    });
  }

  try {
    // Initialize and authenticate
    await apecService.initialize();
    await apecService.authenticate();

    // Create job on APEC
    const result = await apecService.createJobPosting(value);

    if (result.partial) {
      // Timeout occurred, job queued
      await apecService.close();
      await prisma.$disconnect();

      return res.status(504).json({
        success: false,
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Operation exceeded maximum execution time',
          details: 'Job creation queued for background processing',
        },
      });
    }

    // Save to database
    const job = await prisma.job.create({
      data: {
        apecId: result.jobId,
        title: value.title,
        description: value.description,
        location: value.location,
        contractType: value.contractType,
        salary: value.salary,
        experienceLevel: value.experienceLevel,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    await apecService.close();
    await prisma.$disconnect();

    return res.status(201).json({
      success: true,
      data: {
        id: job.id,
        apecId: job.apecId,
        title: job.title,
        status: job.status,
        publishedAt: job.publishedAt,
        url: `https://entreprise.apec.fr/mes-offres/${job.apecId}`,
      },
      message: 'Job created successfully on APEC',
    });
  } catch (error) {
    await apecService.close();
    await prisma.$disconnect();

    console.error('[API:Jobs] Job creation failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_FAILED',
        message: error instanceof Error ? error.message : 'Job creation failed',
      },
    });
  }
}
```

### 5.2 Dashboard Routes

**Create `/api/dashboard/stats.ts`**:

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { prisma } from '../../lib/db/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try cache first
    const cached = await kv.get('cache:dashboard:stats');
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Compute stats
    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({ where: { status: 'PUBLISHED' } });
    const totalViews = await prisma.job.aggregate({
      _sum: { views: true },
      where: { status: 'PUBLISHED' },
    });
    const totalApplications = await prisma.job.aggregate({
      _sum: { applications: true },
      where: { status: 'PUBLISHED' },
    });

    const stats = {
      totalJobs,
      activeJobs,
      totalViews: totalViews._sum.views || 0,
      totalApplications: totalApplications._sum.applications || 0,
      avgViewsPerJob: activeJobs > 0 ? Math.round((totalViews._sum.views || 0) / activeJobs) : 0,
      avgApplicationsPerJob: activeJobs > 0 ? Math.round((totalApplications._sum.applications || 0) / activeJobs) : 0,
    };

    // Cache for 5 minutes
    await kv.set('cache:dashboard:stats', stats, { ex: 300 });

    await prisma.$disconnect();

    return res.status(200).json({
      success: true,
      data: stats,
      cached: false,
    });
  } catch (error) {
    await prisma.$disconnect();
    console.error('[API:Dashboard] Failed to fetch stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
```

---

## Step 6: Configure Cron Jobs

Cron jobs are already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-jobs",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/generate-daily-report",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/cleanup-old-data",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Cron job already created:** `/api/cron/sync-jobs.ts`

**Create remaining cron jobs as needed.**

---

## Step 7: Test Locally

### 7.1 Start Vercel Dev Server

```bash
vercel dev
```

This starts a local server on `http://localhost:3000` that simulates Vercel's serverless environment.

### 7.2 Test Authentication

```bash
curl -X POST http://localhost:3000/api/apec/auth \
  -H "Content-Type: application/json" \
  -d '{"forceRefresh": true}'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "cookieSource": "FRESH_LOGIN",
    "duration": 12500
  },
  "message": "APEC authentication successful"
}
```

### 7.3 Test Job Listing

```bash
curl http://localhost:3000/api/jobs?limit=10
```

### 7.4 Test Cron Job Manually

```bash
curl -X POST http://localhost:3000/api/cron/sync-jobs \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## Step 8: Deploy to Vercel

### 8.1 Preview Deployment

```bash
vercel
```

This creates a preview deployment (e.g., `apec-job-manager-abc123.vercel.app`).

**Test preview deployment:**

```bash
curl https://apec-job-manager-abc123.vercel.app/api/health
```

### 8.2 Production Deployment

Once testing is successful:

```bash
vercel --prod
```

Or push to `main` branch for automatic deployment:

```bash
git add .
git commit -m "feat: migrate to serverless architecture"
git push origin main
```

---

## Step 9: Verify Production

### 9.1 Check Deployment Status

Visit Vercel dashboard:
- Project → Deployments → Latest deployment
- Check build logs
- Verify "Ready" status

### 9.2 Test API Endpoints

```bash
# Replace with your production URL
PROD_URL="https://apec-job-manager.vercel.app"

# Health check
curl $PROD_URL/api/health

# Authentication test
curl -X POST $PROD_URL/api/apec/auth \
  -H "Content-Type: application/json" \
  -d '{"forceRefresh": false}'

# Fetch jobs
curl $PROD_URL/api/jobs
```

### 9.3 Monitor Cron Jobs

Check Vercel dashboard:
- Project → Cron Jobs
- Verify schedules are active
- Check execution logs

### 9.4 Monitor Function Logs

```bash
vercel logs --follow
```

Or filter specific endpoints:

```bash
vercel logs /api/cron/sync-jobs --follow
```

---

## Step 10: Monitor Performance

### 10.1 Key Metrics to Watch

**Via Vercel Dashboard:**
- Function execution time (should be < 55s)
- Error rate (should be < 5%)
- Memory usage (should be < 2.5 GB for Puppeteer functions)
- Database query time (should be < 1s)

**Via Application Logs:**
- Sync success rate (should be > 95%)
- APEC authentication failures
- Timeout errors

### 10.2 Set Up Alerts

In Vercel dashboard:
1. Project → Settings → Notifications
2. Add webhook to Slack/Discord/email
3. Configure alert thresholds:
   - Function errors > 10 in 1 hour
   - Function timeout > 5 in 1 hour
   - Database connection errors

---

## Rollback Plan

If issues occur in production:

### Option 1: Instant Rollback via Dashboard

1. Go to Vercel dashboard
2. Project → Deployments
3. Find previous working deployment
4. Click "Promote to Production"

### Option 2: CLI Rollback

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

### Option 3: Git Revert

```bash
git revert HEAD
git push origin main
```

### Option 4: Emergency: Revert to Monolith

```bash
# Restore original package.json
mv package.json.backup package.json

# Redeploy old architecture to separate server
# (Not on Vercel, as monolith won't work serverless)
```

---

## Troubleshooting

### Issue: Puppeteer timeout

**Symptom:** Functions timeout after 60s

**Solution:**
- Check if operation can be split into smaller chunks
- Reduce batch size in sync jobs
- Use queue system for long operations

### Issue: Authentication fails

**Symptom:** "AUTH_FAILED" errors

**Solution:**
- Verify `APEC_EMAIL` and `APEC_PASSWORD` in Vercel dashboard
- Check if APEC changed their login flow
- Clear KV cookies: `vercel kv del apec:cookies:default`

### Issue: Database connection errors

**Symptom:** "Connection pool exhausted"

**Solution:**
- Ensure `prisma.$disconnect()` is called in all routes
- Use connection pooling via Neon adapter
- Check Postgres connection limits in Vercel dashboard

### Issue: Cron jobs not running

**Symptom:** No sync happening automatically

**Solution:**
- Verify cron schedules in `vercel.json`
- Check if `CRON_SECRET` environment variable is set
- View cron execution logs in Vercel dashboard

---

## Post-Migration Checklist

- [ ] All API endpoints responding correctly
- [ ] Authentication working (cached and fresh)
- [ ] Job creation/update/deletion functional
- [ ] Sync job running on schedule
- [ ] Dashboard stats loading
- [ ] Reports generating
- [ ] Logs captured in Vercel
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team trained on new architecture

---

## Next Steps

1. **Optimize Performance**
   - Add more aggressive caching
   - Implement stale-while-revalidate
   - Add CDN for dashboard assets

2. **Enhance Monitoring**
   - Integrate with Sentry for error tracking
   - Add custom metrics dashboard
   - Set up UptimeRobot for health checks

3. **Add Features**
   - Email notifications for sync failures
   - Webhook integrations for job updates
   - Advanced analytics and reports

---

**Migration Complete!** The APEC Job Manager is now running on Vercel's serverless platform.
