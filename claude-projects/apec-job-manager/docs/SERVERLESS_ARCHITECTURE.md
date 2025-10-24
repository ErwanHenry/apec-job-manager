# SERVERLESS ARCHITECTURE - APEC Job Manager on Vercel

## 1. Executive Summary

This document outlines the serverless backend architecture for APEC Job Manager deployed on Vercel. The original architecture relied on long-running Node.js processes with Puppeteer for web scraping and node-cron for scheduling. The serverless adaptation addresses Vercel's execution model constraints (10-60 second timeouts, stateless functions, no background processes) while maintaining full functionality.

**Key Architecture Changes:**
- Replace long-running Puppeteer sessions with ephemeral, per-request browser instances using `@sparticuz/chromium`
- Replace node-cron with Vercel Cron Jobs (scheduled serverless functions)
- Persist authentication state in Vercel KV (Redis-compatible)
- Split heavy operations into smaller, chained serverless functions
- Use Vercel Postgres with connection pooling for database operations
- Store exports and reports in Vercel Blob Storage

**Initial Project State:** Monolithic Express server with persistent browser sessions, synchronous operations, and local file storage.

---

## 2. Architecture Overview

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL SERVERLESS PLATFORM                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐      ┌──────────────────┐                 │
│  │  API Functions  │      │   Cron Functions │                 │
│  │  (Edge/Node)    │◄────►│   (Scheduled)    │                 │
│  └────────┬────────┘      └────────┬─────────┘                 │
│           │                         │                            │
│           ▼                         ▼                            │
│  ┌─────────────────────────────────────────────┐               │
│  │         APEC Service (Serverless)            │               │
│  │  - Ephemeral Puppeteer + @sparticuz/chromium│               │
│  │  - Chunked operations (< 60s per function)  │               │
│  │  - Stateless browser initialization          │               │
│  └──────┬────────────────────────────┬─────────┘               │
│         │                            │                          │
│         ▼                            ▼                          │
│  ┌──────────────┐           ┌──────────────┐                  │
│  │  Vercel KV   │           │  Vercel      │                  │
│  │  (Redis)     │           │  Postgres    │                  │
│  │              │           │              │                  │
│  │ - APEC cookies│          │ - Jobs       │                  │
│  │ - Sessions    │          │ - SyncHistory│                  │
│  │ - Rate limits │          │ - Reports    │                  │
│  └──────────────┘           └──────────────┘                  │
│                                                                  │
│  ┌──────────────────────────────────┐                          │
│  │       Vercel Blob Storage        │                          │
│  │  - PDF Reports                    │                          │
│  │  - CSV Exports                    │                          │
│  │  - Job Attachments                │                          │
│  └──────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐           ┌──────────────┐                   │
│  │  APEC.FR     │           │  Browserless │ (Optional)         │
│  │  (Target)    │           │  (Fallback)  │                   │
│  └──────────────┘           └──────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

**Synchronous API Request (User-initiated):**
```
Client → API Route → ApecServiceServerless
  → Initialize ephemeral Chromium
  → Authenticate (restore from KV or fresh login)
  → Execute operation (< 60s)
  → Store result in Postgres
  → Save cookies to KV
  → Close browser
  → Return response
```

**Asynchronous Cron Job (Scheduled):**
```
Vercel Cron Trigger → /api/cron/sync-jobs
  → Queue sync operation
  → Split into batches (10 jobs per function)
  → Chain functions via HTTP calls
  → Aggregate results
  → Store sync report
  → Send notification (optional)
```

---

## 3. Service Definitions

### 3.1 API Services (Serverless Functions)

#### 3.1.1 Job Management Service
**Path:** `/api/jobs/*`
**Runtime:** Node.js 18.x
**Timeout:** 60s (Pro plan)
**Memory:** 1024 MB

**Endpoints:**
- `GET /api/jobs` - List jobs (Postgres query)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (Puppeteer operation)
- `PUT /api/jobs/:id` - Update job (Puppeteer operation)
- `DELETE /api/jobs/:id` - Delete job (Puppeteer operation)
- `POST /api/jobs/sync` - Trigger manual sync (queues background job)

**Responsibilities:**
- Job CRUD operations
- Coordinate with APEC service
- Database persistence
- Response formatting

#### 3.1.2 APEC Automation Service
**Path:** `/api/apec/*`
**Runtime:** Node.js 18.x
**Timeout:** 60s
**Memory:** 3008 MB (maximum for Puppeteer)

**Endpoints:**
- `POST /api/apec/auth` - Test authentication
- `GET /api/apec/scrape/:jobId` - Scrape single job
- `POST /api/apec/batch-scrape` - Scrape job batch (max 10)

**Responsibilities:**
- Ephemeral Chromium initialization
- APEC authentication with cookie persistence
- Web scraping operations
- Timeout management
- Error handling and retry logic

#### 3.1.3 Cron Service
**Path:** `/api/cron/*`
**Runtime:** Node.js 18.x
**Timeout:** 60s
**Memory:** 1024 MB

**Endpoints:**
- `POST /api/cron/sync-jobs` - Full sync orchestrator
- `POST /api/cron/generate-daily-report` - Daily report generation
- `POST /api/cron/cleanup-old-data` - Data retention cleanup

**Responsibilities:**
- Scheduled task execution
- Batch coordination
- Progress tracking
- Result aggregation

#### 3.1.4 Report Service
**Path:** `/api/reports/*`
**Runtime:** Node.js 18.x
**Timeout:** 30s
**Memory:** 512 MB

**Endpoints:**
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/:id/download` - Download report file

**Responsibilities:**
- Report generation
- Export to PDF/CSV/JSON
- Upload to Blob Storage
- Presigned URL generation

#### 3.1.5 Dashboard Service
**Path:** `/api/dashboard/*`
**Runtime:** Node.js 18.x (Edge compatible)
**Timeout:** 10s
**Memory:** 512 MB

**Endpoints:**
- `GET /api/dashboard/stats` - Aggregated statistics
- `GET /api/dashboard/recent-activity` - Recent actions
- `GET /api/dashboard/performance` - Top performing jobs

**Responsibilities:**
- Analytics aggregation
- Dashboard data preparation
- Fast read operations

---

## 4. API Contracts

### 4.1 Job Creation

**Endpoint:** `POST /api/jobs`

**Request Body:**
```json
{
  "title": "Développeur Full Stack Senior",
  "description": "Nous recherchons un développeur expérimenté...",
  "location": "Paris (75000)",
  "contractType": "CDI",
  "salary": "50000-60000",
  "experienceLevel": "senior",
  "skills": ["React", "Node.js", "PostgreSQL"]
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "apecId": "AP12345678",
    "title": "Développeur Full Stack Senior",
    "status": "PUBLISHED",
    "publishedAt": "2025-10-24T10:30:00.000Z",
    "url": "https://entreprise.apec.fr/mes-offres/AP12345678"
  },
  "message": "Job created successfully on APEC"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid job data",
    "details": [
      {
        "field": "title",
        "message": "Title is required and must be between 10-100 characters"
      }
    ]
  }
}
```

**Error Response (504 Gateway Timeout):**
```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "Operation exceeded maximum execution time",
    "details": "Job creation queued for background processing. Check /api/jobs/status/:jobId"
  }
}
```

### 4.2 Job Synchronization

**Endpoint:** `POST /api/jobs/sync`

**Request Body:**
```json
{
  "mode": "incremental",
  "batchSize": 10
}
```

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "syncId": "sync_1729765800",
    "status": "IN_PROGRESS",
    "estimatedDuration": 120,
    "statusUrl": "/api/jobs/sync/sync_1729765800/status"
  },
  "message": "Synchronization started in background"
}
```

**Status Check Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "syncId": "sync_1729765800",
    "status": "COMPLETED",
    "progress": {
      "current": 47,
      "total": 47,
      "percentage": 100
    },
    "results": {
      "created": 3,
      "updated": 12,
      "deleted": 1,
      "unchanged": 31,
      "errors": 0
    },
    "startedAt": "2025-10-24T10:00:00.000Z",
    "completedAt": "2025-10-24T10:02:15.000Z",
    "duration": 135
  }
}
```

### 4.3 Authentication Test

**Endpoint:** `POST /api/apec/auth`

**Request Body:**
```json
{
  "forceRefresh": false
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "cookieSource": "KV_CACHE",
    "cookieAge": 3600,
    "expiresIn": 82800
  },
  "message": "APEC authentication successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "APEC authentication failed",
    "details": "Invalid credentials or session expired",
    "suggestion": "Check APEC_EMAIL and APEC_PASSWORD environment variables"
  }
}
```

---

## 5. Data Schema

### 5.1 PostgreSQL Schema (Vercel Postgres)

```sql
-- Jobs table
CREATE TABLE jobs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  apec_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(100),
  contract_type VARCHAR(20),
  salary VARCHAR(50),
  experience_level VARCHAR(20),
  skills JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'DRAFT',
  views INTEGER DEFAULT 0,
  applications INTEGER DEFAULT 0,
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_apec_id ON jobs(apec_id);
CREATE INDEX idx_jobs_published_at ON jobs(published_at DESC);
CREATE INDEX idx_jobs_last_sync_at ON jobs(last_sync_at);

-- Sync history table
CREATE TABLE sync_history (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS',
  mode VARCHAR(20) DEFAULT 'incremental',
  batch_size INTEGER DEFAULT 10,
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER,
  results JSONB DEFAULT '{}'::jsonb,
  error_details TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration INTEGER
);

CREATE INDEX idx_sync_history_sync_id ON sync_history(sync_id);
CREATE INDEX idx_sync_history_started_at ON sync_history(started_at DESC);

-- Reports table
CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  format VARCHAR(10) DEFAULT 'json',
  file_url TEXT,
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'GENERATING',
  generated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);

-- Audit log table
CREATE TABLE audit_log (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  user_id VARCHAR(36),
  ip_address INET,
  user_agent TEXT,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

### 5.2 Vercel KV Schema (Redis)

**Key Patterns:**

```javascript
// APEC authentication cookies
`apec:cookies:${userId}` → JSON
{
  cookies: [
    { name: "session_id", value: "abc123...", domain: ".apec.fr", ... }
  ],
  createdAt: 1729765800,
  expiresAt: 1729852200
}
// TTL: 86400 (24 hours)

// Rate limiting
`ratelimit:ip:${ipAddress}` → Number (request count)
// TTL: 900 (15 minutes)

// Sync job progress
`sync:progress:${syncId}` → JSON
{
  current: 25,
  total: 50,
  percentage: 50,
  lastUpdate: 1729765800
}
// TTL: 3600 (1 hour)

// Function locks (prevent concurrent execution)
`lock:sync:${syncId}` → String (lock holder ID)
// TTL: 300 (5 minutes)

// Cache for frequently accessed data
`cache:dashboard:stats` → JSON
// TTL: 300 (5 minutes)
```

### 5.3 Vercel Blob Storage

**File Organization:**

```
/reports/
  /daily/
    report-2025-10-24.pdf
    report-2025-10-24.csv
  /weekly/
    report-2025-W43.pdf
  /monthly/
    report-2025-10.pdf

/exports/
  /jobs/
    jobs-export-1729765800.csv
    jobs-export-1729765800.json

/attachments/
  /jobs/
    ${jobId}/
      company-logo.png
      job-description.pdf
```

---

## 6. Technology Stack Rationale

### 6.1 Puppeteer with @sparticuz/chromium

**Choice:** `@sparticuz/chromium` + `puppeteer-core`

**Justification:**
- Official Puppeteer is too large (300+ MB) for serverless
- @sparticuz/chromium provides optimized Chromium binary (< 50 MB compressed)
- Specifically designed for AWS Lambda and Vercel environments
- Includes all necessary dependencies
- Active maintenance and compatibility updates

**Trade-offs vs Alternatives:**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| @sparticuz/chromium | Optimized size, works in Lambda/Vercel, reliable | Still requires 1-3 GB memory | **SELECTED** |
| chrome-aws-lambda | Predecessor to @sparticuz | Deprecated, no longer maintained | ❌ Rejected |
| Browserless.io | Zero setup, managed service, no cold starts | $19-99/mo, external dependency, latency | Fallback option |
| Playwright | Better API, faster in some cases | Larger bundle size, less serverless examples | Future consideration |
| Bright Data | Enterprise grade, residential proxies | Expensive ($500+/mo), overkill for APEC | ❌ Rejected |

**Implementation Strategy:**
```javascript
// Primary: @sparticuz/chromium
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

### 6.2 Vercel Cron Jobs

**Choice:** Native Vercel Cron

**Justification:**
- Native integration with Vercel platform
- No additional infrastructure required
- Automatic retry and failure handling
- Logs integrated with Vercel dashboard
- Free on Pro plan (up to 100 cron jobs)

**Trade-offs vs Alternatives:**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| Vercel Cron | Native, free (Pro), simple config | Limited to 1-minute intervals, no complex scheduling | **SELECTED** |
| GitHub Actions | Free for public repos, flexible | Requires GitHub, more complex setup | ❌ Too complex |
| AWS EventBridge | Very flexible, enterprise features | Additional service, cost, complexity | ❌ Overkill |
| EasyCron / Cron-job.org | External service, simple | Yet another dependency, potential downtime | ❌ External dependency |
| BullMQ + Redis | Full queue system, advanced features | Requires persistent Redis, more infrastructure | ❌ Too complex |

**Configuration:**
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

### 6.3 Vercel KV (Redis)

**Choice:** Vercel KV powered by Upstash

**Justification:**
- Native Vercel integration
- Redis-compatible API (familiar to developers)
- Global edge replication for low latency
- Pay-per-request pricing (no idle costs)
- Automatic scaling and high availability

**Trade-offs vs Alternatives:**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| Vercel KV | Native, edge-replicated, Redis API | Limited to 256 MB (Hobby), costs on Pro | **SELECTED** |
| Redis Cloud | Full Redis features, larger storage | Separate service, more complex setup | ❌ Unnecessary complexity |
| DynamoDB | AWS native, unlimited scale | Different API, cold starts, vendor lock-in | ❌ Wrong vendor |
| Postgres JSONB | One less service | Not optimized for cache/session use cases | ❌ Wrong tool |

**Usage Patterns:**
- Session/cookie storage (TTL: 24h)
- Rate limiting counters (TTL: 15min)
- Sync progress tracking (TTL: 1h)
- Dashboard statistics cache (TTL: 5min)

### 6.4 Vercel Postgres

**Choice:** Vercel Postgres powered by Neon

**Justification:**
- Native Vercel integration
- Serverless Postgres with connection pooling
- Automatic scaling and branching
- Compatible with Prisma ORM
- Built-in backup and point-in-time recovery

**Trade-offs vs Alternatives:**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| Vercel Postgres | Native, serverless, Prisma support | Limited storage (256 MB Hobby) | **SELECTED** |
| Supabase | More features (auth, storage, realtime) | Separate platform, more complex | ❌ Feature overkill |
| PlanetScale | MySQL-compatible, generous free tier | MySQL (not Postgres), separate service | ❌ Prefer Postgres |
| Railway | Good free tier, simple setup | Another platform, less Vercel integration | ❌ Platform fragmentation |
| Self-hosted Postgres | Full control | Requires server management, no serverless | ❌ Against serverless principle |

**Connection Strategy:**
```javascript
// Use @prisma/adapter-neon for optimal pooling
import { PrismaClient } from '@prisma/client';
import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });
```

### 6.5 Vercel Blob Storage

**Choice:** Vercel Blob

**Justification:**
- Native Vercel integration
- Automatic CDN distribution
- Presigned URL support for secure downloads
- Simple API for uploads/downloads
- Pay-per-GB storage pricing

**Trade-offs vs Alternatives:**

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| Vercel Blob | Native, CDN, presigned URLs | 1 GB free then paid | **SELECTED** |
| AWS S3 | Industry standard, feature-rich | Separate AWS account, more complex SDK | ❌ Platform fragmentation |
| Cloudinary | Great for images, transformations | Focused on media, overkill for PDFs/CSVs | ❌ Wrong use case |
| Supabase Storage | Integrated with Supabase | Requires Supabase setup | ❌ Not using Supabase |

**Usage:**
```javascript
import { put, head, del } from '@vercel/blob';

// Upload report
const blob = await put('reports/daily/report-2025-10-24.pdf', file, {
  access: 'public',
  addRandomSuffix: false,
});

// Generate download URL (expires in 1 hour)
const url = blob.url;
```

---

## 7. Key Considerations

### 7.1 Scalability

**How will the system handle 10x the initial load?**

**Current Baseline:**
- Estimate: 50 job postings
- Daily sync: 1 execution
- Manual operations: ~10/day
- Total function invocations: ~15/day

**10x Load Scenario:**
- 500 job postings
- Hourly sync: 24 executions/day
- Manual operations: ~100/day
- Total function invocations: ~150/day

**Scaling Strategy:**

1. **Horizontal Scaling (Automatic)**
   - Vercel automatically spawns multiple function instances
   - Each function handles one request independently
   - No coordination needed for stateless operations
   - Cold start mitigation: keep functions warm with periodic health checks

2. **Batch Processing**
   - Split sync operations into batches of 10 jobs
   - Process batches in parallel (up to 10 concurrent functions)
   - Aggregate results in final step
   - Example: 500 jobs = 50 batches = 5 parallel waves = ~5 minutes total

3. **Caching Strategy**
   - Cache dashboard stats for 5 minutes (KV)
   - Cache job list for 2 minutes (KV)
   - Use stale-while-revalidate pattern
   - Reduce Postgres queries by 80%

4. **Database Optimization**
   - Connection pooling via @prisma/adapter-neon
   - Indexed queries on status, apec_id, published_at
   - Limit queries to 50 rows by default
   - Pagination for large result sets

5. **Rate Limiting**
   - 100 requests per 15 minutes per IP (API)
   - 10 sync requests per hour (Cron)
   - Prevent APEC.FR from blocking via exponential backoff

**Bottlenecks and Mitigations:**

| Bottleneck | Impact at 10x | Mitigation |
|------------|---------------|------------|
| Puppeteer memory (3 GB) | 10 concurrent browsers = 30 GB | Batch processing + queue system |
| Postgres connections | 100 max connections | Connection pooling + close after use |
| Vercel function timeout | 60s per function | Split into smaller operations |
| APEC.FR rate limits | Unknown, likely 1 req/sec | Exponential backoff + respect robots.txt |
| KV memory (256 MB) | Cookie storage ~1 KB each | TTL 24h, auto-eviction |

### 7.2 Security

**Primary Threat Vectors and Mitigation Strategies:**

#### 7.2.1 Credential Exposure

**Threat:** APEC credentials leaked via environment variables, logs, or error messages

**Mitigations:**
- Store credentials in Vercel Environment Variables (encrypted at rest)
- Never log credentials or cookies in plain text
- Use separate service account for APEC (not personal account)
- Rotate credentials every 90 days
- Implement credential validation on startup

```javascript
// Bad: Logs credentials
logger.info(`Authenticating with ${process.env.APEC_EMAIL}`);

// Good: Logs masked version
logger.info(`Authenticating with ${maskEmail(process.env.APEC_EMAIL)}`);
```

#### 7.2.2 Session Hijacking

**Threat:** Attacker steals APEC cookies from KV and impersonates legitimate user

**Mitigations:**
- Encrypt cookies before storing in KV using AES-256
- Set TTL of 24 hours max on cookie storage
- Validate cookies on each use (check domain, path, expiry)
- Implement anomaly detection (IP changes, unusual patterns)

```javascript
// Encrypt before storing
const encrypted = encrypt(JSON.stringify(cookies), process.env.ENCRYPTION_KEY);
await kv.set(`apec:cookies:${userId}`, encrypted, { ex: 86400 });

// Decrypt on retrieval
const encrypted = await kv.get(`apec:cookies:${userId}`);
const cookies = JSON.parse(decrypt(encrypted, process.env.ENCRYPTION_KEY));
```

#### 7.2.3 Injection Attacks

**Threat:** SQL injection, NoSQL injection, command injection via user inputs

**Mitigations:**
- Use Prisma ORM for parameterized queries (prevents SQL injection)
- Validate all inputs with Joi schemas
- Sanitize HTML in job descriptions (prevent XSS)
- Never use `eval()` or `Function()` with user inputs
- Implement Content Security Policy (CSP) headers

```javascript
// Validation schema
const jobSchema = Joi.object({
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().min(50).max(5000).required(),
  location: Joi.string().pattern(/^[a-zA-Z\s\-]+\(\d{5}\)$/),
  contractType: Joi.string().valid('CDI', 'CDD', 'Freelance', 'Stage'),
  salary: Joi.string().pattern(/^\d+-\d+$/),
});
```

#### 7.2.4 Denial of Service (DoS)

**Threat:** Attacker overwhelms API with requests, exhausting function execution limits

**Mitigations:**
- Rate limiting via KV (100 requests per 15 min per IP)
- Implement request size limits (max 1 MB)
- Add CAPTCHA for sensitive operations (optional)
- Monitor function invocations and set alerts
- Implement exponential backoff for retries

```javascript
// Rate limiting middleware
async function rateLimit(ip) {
  const key = `ratelimit:ip:${ip}`;
  const count = await kv.incr(key);

  if (count === 1) {
    await kv.expire(key, 900); // 15 minutes
  }

  if (count > 100) {
    throw new Error('Rate limit exceeded');
  }
}
```

#### 7.2.5 Data Exposure

**Threat:** Unauthorized access to job data, reports, or audit logs

**Mitigations:**
- Implement JWT authentication for API access
- Use Vercel Blob presigned URLs (expire in 1 hour)
- Apply row-level security in Postgres (if multi-tenant)
- Audit all data access in audit_log table
- Encrypt sensitive fields (salary, applicant data)

```javascript
// Presigned URL for reports
const { url } = await put(`reports/daily/report-${date}.pdf`, file, {
  access: 'public',
  token: generateToken({ expiresIn: '1h' }),
});
```

### 7.3 Observability

**How will we monitor the system's health and debug issues?**

#### 7.3.1 Logging Strategy

**Structured Logging with Winston:**

```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'apec-job-manager' },
  transports: [
    new winston.transports.Console(),
    // Vercel automatically captures stdout/stderr
  ],
});

// Usage
logger.info('Job sync started', { syncId, batchSize });
logger.error('Puppeteer timeout', { jobId, duration, error: err.message });
```

**Log Levels:**
- `error` - Critical failures requiring immediate attention
- `warn` - Recoverable issues (e.g., retries)
- `info` - Business events (job created, sync completed)
- `debug` - Detailed technical information (development only)

#### 7.3.2 Metrics Collection

**Key Metrics to Track:**

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Function execution time | Vercel logs | > 50s (approaching timeout) |
| Function error rate | Vercel dashboard | > 5% |
| Database query time | Prisma metrics | > 1s |
| Sync success rate | Custom metric | < 95% |
| APEC auth failures | Custom counter | > 3 per day |
| KV hit rate | Vercel KV dashboard | < 70% |
| Blob storage usage | Vercel dashboard | > 80% of quota |

**Implementation:**

```javascript
// Custom metrics in database
await prisma.metric.create({
  data: {
    name: 'sync_duration',
    value: duration,
    labels: { syncId, status: 'success' },
    timestamp: new Date(),
  },
});

// Query for dashboards
const avgDuration = await prisma.metric.aggregate({
  where: { name: 'sync_duration', timestamp: { gte: oneDayAgo } },
  _avg: { value: true },
});
```

#### 7.3.3 Error Tracking

**Vercel Built-in Error Tracking:**
- Automatic error capture in function logs
- Stack traces preserved
- Request context included

**Enhanced Error Context:**

```javascript
try {
  await createJobPosting(jobData);
} catch (error) {
  logger.error('Job creation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    context: {
      jobData,
      userId,
      timestamp: new Date(),
    },
    function: 'createJobPosting',
  });

  // Store in audit log
  await prisma.auditLog.create({
    data: {
      action: 'JOB_CREATE_FAILED',
      resourceType: 'job',
      payload: { jobData, error: error.message },
    },
  });

  throw error;
}
```

#### 7.3.4 Health Checks

**Endpoint:** `GET /api/health`

```javascript
{
  "status": "healthy",
  "timestamp": "2025-10-24T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "latency": 45
    },
    "kv": {
      "status": "up",
      "latency": 12
    },
    "blob": {
      "status": "up"
    },
    "apec": {
      "status": "authenticated",
      "lastCheck": "2025-10-24T10:25:00.000Z"
    }
  },
  "version": "1.0.0"
}
```

**Monitoring Strategy:**
- UptimeRobot: Ping /api/health every 5 minutes
- Vercel: Built-in uptime monitoring
- Custom alerts: Send webhook to Slack on errors

#### 7.3.5 Debugging Tools

**1. Vercel Logs:**
- Real-time log streaming: `vercel logs --follow`
- Filter by function: `vercel logs /api/jobs/sync`
- Filter by severity: `vercel logs --level error`

**2. Prisma Studio:**
- Visual database browser
- Run locally: `npx prisma studio`
- Inspect jobs, sync history, audit logs

**3. KV CLI:**
```bash
# List all keys
vercel kv list

# Get specific key
vercel kv get apec:cookies:user123

# Delete key
vercel kv del apec:cookies:user123
```

**4. Request Tracing:**
```javascript
// Generate trace ID for each request
const traceId = crypto.randomUUID();
res.setHeader('X-Trace-Id', traceId);

// Include in all logs
logger.info('Job sync started', { traceId, syncId });
```

### 7.4 Deployment & CI/CD

**How will this architecture be deployed?**

#### 7.4.1 Deployment Strategy

**Vercel Git Integration (Recommended):**

```bash
# 1. Connect GitHub repository to Vercel
vercel link

# 2. Configure production environment
vercel env add APEC_EMAIL production
vercel env add APEC_PASSWORD production
vercel env add DATABASE_URL production
vercel env add ENCRYPTION_KEY production

# 3. Push to main branch → automatic deployment
git push origin main
```

**Manual Deployment:**

```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel
```

#### 7.4.2 CI/CD Pipeline (GitHub Actions)

**Workflow:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npx prisma validate
      - run: npx prisma generate

  deploy-preview:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 7.4.3 Environment Configuration

**Required Environment Variables:**

| Variable | Description | Example | Secret |
|----------|-------------|---------|--------|
| `APEC_EMAIL` | APEC account email | user@company.fr | Yes |
| `APEC_PASSWORD` | APEC account password | MyP@ssw0rd | Yes |
| `DATABASE_URL` | Postgres connection string | postgres://... | Yes |
| `KV_URL` | Vercel KV URL | redis://... | Yes |
| `KV_REST_API_URL` | KV REST API URL | https://... | Yes |
| `KV_REST_API_TOKEN` | KV REST API token | AZaz... | Yes |
| `BLOB_READ_WRITE_TOKEN` | Blob storage token | vercel_blob_... | Yes |
| `ENCRYPTION_KEY` | Cookie encryption key (32 bytes) | hex string | Yes |
| `JWT_SECRET` | JWT signing secret | random string | Yes |
| `NODE_ENV` | Environment | production | No |

**Setting Secrets:**

```bash
# Production
vercel env add APEC_EMAIL production
vercel env add APEC_PASSWORD production

# Preview (optional)
vercel env add APEC_EMAIL preview

# Development (local only)
echo "APEC_EMAIL=test@example.com" >> .env
```

#### 7.4.4 Database Migrations

**Migration Strategy:**

```bash
# 1. Create migration
npx prisma migrate dev --name add_sync_history

# 2. Commit migration files
git add prisma/migrations/
git commit -m "feat: add sync history table"

# 3. Push to repository
git push origin main

# 4. Apply to production (automatic via Vercel build)
# Or manually:
npx prisma migrate deploy
```

**Vercel Build Command:**

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && npm run build"
}
```

#### 7.4.5 Rollback Strategy

**Automatic Rollback:**
- Vercel keeps 100 deployments in history
- One-click rollback in Vercel dashboard
- Previous deployment instantly reactivated

**Manual Rollback:**

```bash
# List recent deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url>
```

**Database Rollback:**

```bash
# Revert last migration
npx prisma migrate resolve --rolled-back 20251024_add_sync_history

# Apply previous schema state
npx prisma db push --force-reset  # DANGER: data loss
```

#### 7.4.6 Blue-Green Deployment (Optional)

**For Zero-Downtime Updates:**

```bash
# 1. Deploy to preview environment
vercel

# 2. Test preview deployment
curl https://apec-job-manager-preview-xyz.vercel.app/api/health

# 3. Smoke tests pass → promote to production
vercel promote <preview-url> --prod

# 4. Monitor production metrics

# 5. Rollback if issues detected
vercel promote <previous-deployment-url> --prod
```

---

## 8. Implementation Checklist

### Phase 1: Infrastructure Setup (Week 1)

- [ ] Create Vercel project
- [ ] Enable Vercel Postgres
- [ ] Enable Vercel KV
- [ ] Enable Vercel Blob Storage
- [ ] Configure environment variables
- [ ] Set up GitHub repository connection
- [ ] Configure custom domain (optional)

### Phase 2: Database Migration (Week 1)

- [ ] Convert Prisma schema for Vercel Postgres
- [ ] Add @prisma/adapter-neon
- [ ] Test connection pooling
- [ ] Run initial migration
- [ ] Seed test data
- [ ] Verify Prisma Studio access

### Phase 3: Core Services (Week 2-3)

- [ ] Implement `lib/services/apecServiceServerless.ts`
- [ ] Add @sparticuz/chromium dependency
- [ ] Create cookie encryption/decryption utilities
- [ ] Implement KV cookie storage
- [ ] Test authentication flow
- [ ] Add timeout handling
- [ ] Implement retry logic with exponential backoff

### Phase 4: API Endpoints (Week 3-4)

- [ ] Migrate `/api/jobs/*` endpoints
- [ ] Migrate `/api/dashboard/*` endpoints
- [ ] Migrate `/api/reports/*` endpoints
- [ ] Add `/api/apec/*` endpoints
- [ ] Add `/api/cron/*` endpoints
- [ ] Implement input validation (Joi)
- [ ] Add error handling middleware
- [ ] Add rate limiting middleware

### Phase 5: Cron Jobs (Week 4)

- [ ] Configure `vercel.json` cron schedules
- [ ] Implement sync orchestrator
- [ ] Add batch processing logic
- [ ] Test cron execution locally
- [ ] Deploy and verify scheduled execution
- [ ] Add cron job monitoring

### Phase 6: Storage & Reports (Week 5)

- [ ] Implement report generation
- [ ] Add Vercel Blob upload
- [ ] Generate presigned URLs
- [ ] Test PDF/CSV export
- [ ] Add cleanup job for old files
- [ ] Implement download endpoint

### Phase 7: Observability (Week 5)

- [ ] Configure Winston structured logging
- [ ] Add health check endpoint
- [ ] Implement custom metrics
- [ ] Set up UptimeRobot monitoring
- [ ] Configure Vercel alerts
- [ ] Add Slack webhook integration
- [ ] Create dashboard for metrics

### Phase 8: Security Hardening (Week 6)

- [ ] Implement JWT authentication
- [ ] Add CORS configuration
- [ ] Add Helmet security headers
- [ ] Implement rate limiting
- [ ] Add input sanitization
- [ ] Encrypt sensitive data in KV
- [ ] Run security audit (npm audit)
- [ ] Penetration testing (optional)

### Phase 9: Testing (Week 6-7)

- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] Load testing (simulate 10x traffic)
- [ ] Test timeout scenarios
- [ ] Test cron job execution
- [ ] Test rollback procedure

### Phase 10: Production Launch (Week 7)

- [ ] Final code review
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Verify all cron jobs running
- [ ] Monitor logs for 24 hours
- [ ] Perform manual sync test
- [ ] Notify stakeholders
- [ ] Create runbook for common issues

---

## 9. Cost Estimation

### Vercel Pro Plan: $20/month

**Included:**
- Unlimited deployments
- Serverless functions (up to 1000 GB-hours)
- 100 cron jobs
- 1 TB bandwidth
- Vercel KV: 256 MB storage, 1M reads, 250K writes
- Vercel Postgres: 256 MB storage, 60 compute hours
- Vercel Blob: 1 GB storage

**Estimated Usage (500 jobs, hourly sync):**

| Resource | Usage | Cost |
|----------|-------|------|
| Function executions | ~3,000/month | Included |
| Function duration | ~50 GB-hours | Included |
| Cron jobs | 3 schedules | Included |
| KV storage | ~10 MB | Included |
| KV operations | ~100K/month | Included |
| Postgres storage | ~50 MB | Included |
| Postgres compute | ~20 hours | Included |
| Blob storage | ~500 MB | Included |
| Bandwidth | ~10 GB | Included |

**Total Monthly Cost: $20** (within Pro plan limits)

**Scaling Costs (5,000 jobs, continuous sync):**
- Additional function GB-hours: $40/100 GB-hours
- Additional KV operations: $0.15/1M reads, $0.60/1M writes
- Additional Postgres storage: $0.25/GB
- Additional Blob storage: $0.15/GB

**Estimated at 10x scale: $40-60/month**

---

## 10. Conclusion

This serverless architecture transforms the APEC Job Manager from a monolithic, stateful application into a scalable, resilient, cloud-native system optimized for Vercel's serverless platform.

**Key Achievements:**
- Zero-infrastructure management (no servers to maintain)
- Automatic scaling from 0 to 1000s of requests
- 99.9% uptime SLA from Vercel
- Global edge distribution for low latency
- Cost-effective ($20/month for typical usage)
- Built-in monitoring and observability
- Secure by default (encrypted environment variables, HTTPS)

**Next Steps:**
1. Review this document with stakeholders
2. Approve technology choices
3. Begin Phase 1 implementation (Infrastructure Setup)
4. Set up weekly progress reviews
5. Plan beta testing with real APEC account

**Success Criteria:**
- All existing features work in serverless environment
- No timeout errors during normal operations
- 95%+ success rate for sync jobs
- < 5 second response time for API calls
- Zero security incidents in first 90 days
