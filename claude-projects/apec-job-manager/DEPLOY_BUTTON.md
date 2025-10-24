# Deploy to Vercel - One Click

## Quick Deploy

Deploy APEC Job Manager to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager&env=APEC_EMAIL,APEC_PASSWORD,APEC_COMPANY_ID,JWT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Environment%20variables%20required%20for%20APEC%20Job%20Manager&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapec-job-manager%2Fblob%2Fmain%2F.env.example&project-name=apec-job-manager&repository-name=apec-job-manager&demo-title=APEC%20Job%20Manager&demo-description=Automated%20job%20posting%20manager%20for%20APEC.FR%20with%20dashboard%20and%20analytics&demo-url=https%3A%2F%2Fapec-job-manager.vercel.app&stores=[{"type":"postgres"},{"type":"kv"},{"type":"blob"}])

---

## What's Included

When you click the deploy button, Vercel will:

1. **Fork/Clone the repository** to your GitHub account
2. **Create a new Vercel project** linked to your GitHub repo
3. **Prompt you for environment variables**:
   - `APEC_EMAIL` - Your APEC account email
   - `APEC_PASSWORD` - Your APEC account password
   - `APEC_COMPANY_ID` - Your company ID on APEC
   - `JWT_SECRET` - Secure JWT secret (32+ chars)
   - `NEXTAUTH_SECRET` - Secure NextAuth secret (32+ chars)
   - `NEXTAUTH_URL` - Your production URL (auto-filled)

4. **Automatically provision**:
   - Vercel Postgres database
   - Vercel KV (Redis cache)
   - Vercel Blob storage

5. **Deploy your application** to production
6. **Set up automatic deployments** on every git push

---

## After Deployment

### 1. Configure Vercel Services

The deploy button will prompt you to add these storages:

#### Postgres Database
- **Purpose**: Store jobs, sync history, reports, audit logs
- **Region**: Select **Paris (cdg1)** or **Frankfurt (fra1)**
- **Name**: `apec-job-manager-db`
- Click **"Create & Link"**

#### KV Storage (Redis)
- **Purpose**: Cache API responses, rate limiting
- **Region**: Select **Paris (cdg1)**
- **Name**: `apec-job-manager-kv`
- Click **"Create & Link"**

#### Blob Storage
- **Purpose**: Store exported reports (PDF, CSV, Excel)
- **Name**: `apec-job-manager-blob`
- Click **"Create & Link"**

### 2. Run Database Migrations

After the initial deployment, you need to set up the database schema:

```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

Or use the Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add a new variable: `MIGRATE_DB=true`
3. Redeploy to trigger migrations

### 3. Verify Deployment

Check that everything is working:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-24T...",
#   "services": {
#     "database": "healthy",
#     "cache": "healthy"
#   }
# }
```

Visit your dashboard: `https://your-app.vercel.app`

### 4. Configure Additional Environment Variables

Add these optional variables in Vercel Dashboard → Settings → Environment Variables:

#### Email Notifications (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
REPORT_EMAIL_RECIPIENTS=reports@company.com
```

**Gmail App Password**: [Generate here](https://support.google.com/accounts/answer/185833)

#### Slack Notifications (Optional)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Slack Webhook**: [Create here](https://api.slack.com/messaging/webhooks)

#### Monitoring (Optional)
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

**Sentry Project**: [Create here](https://sentry.io)

### 5. Secure Cron Jobs

Generate a cron secret to secure scheduled tasks:

```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to Vercel environment variables
vercel env add CRON_SECRET production
# Paste the generated string
```

This prevents unauthorized access to your cron endpoints.

---

## Manual Configuration

If you prefer to configure everything manually, follow these steps:

### 1. Fork Repository

Fork the repository to your GitHub account:
```
https://github.com/your-username/apec-job-manager
```

### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **"Import Project"**
3. Select your forked repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**:
     ```bash
     npm install && cd dashboard && npm install && cd .. && cd dashboard && npm run build
     ```
   - **Output Directory**: `dashboard/dist`

### 3. Add Environment Variables

Go to **Settings** → **Environment Variables** and add all required variables from `.env.example`.

Required variables:
- `APEC_EMAIL`
- `APEC_PASSWORD`
- `APEC_COMPANY_ID`
- `JWT_SECRET` (generate with crypto)
- `NEXTAUTH_SECRET` (generate with crypto)
- `NEXTAUTH_URL` (your production URL)

### 4. Add Vercel Storage

#### Postgres
```bash
vercel postgres create apec-job-manager-db --region cdg1
```

#### KV
```bash
vercel kv create apec-job-manager-kv --region cdg1
```

#### Blob
```bash
vercel blob create apec-job-manager-blob
```

### 5. Deploy

```bash
vercel --prod
```

---

## Deployment URL

After deployment, your app will be available at:

```
https://apec-job-manager-[random-id].vercel.app
```

You can also add a custom domain:
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `apec.yourcompany.com`)
3. Configure DNS according to Vercel instructions

---

## Cron Jobs Schedule

These cron jobs will run automatically on Vercel (requires Pro plan for unlimited executions):

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/sync` | Every 6 hours | Sync jobs from APEC |
| `/api/cron/daily-report` | Daily at 8:00 AM | Send daily report email |
| `/api/cron/cleanup` | Daily at 2:00 AM | Clean up old data (>90 days) |

On the Free plan, crons are limited to 1 per day.

---

## Vercel Limits

### Free Plan
- 100 GB Bandwidth
- 6,000 Function invocations/day
- 100 hours Function execution time
- 1 Cron job
- 1 KV database (256 MB)
- 1 Postgres database (256 MB)
- Unlimited Blob storage (up to file size limit)

### Pro Plan ($20/month)
- 1 TB Bandwidth
- 1,000,000 Function invocations/month
- 1,000 hours Function execution time
- Unlimited Cron jobs
- Unlimited KV databases
- Unlimited Postgres databases
- Unlimited Blob storage

For this application, we recommend the **Pro plan** for production use due to:
- Multiple cron jobs (3 scheduled tasks)
- High function invocations (API + Dashboard)
- Database and cache usage

---

## Next Steps

1. **Test your deployment**: Visit the dashboard and try syncing jobs
2. **Configure monitoring**: Set up Sentry or other error tracking
3. **Set up alerts**: Configure UptimeRobot or Pingdom
4. **Add team members**: Invite collaborators in Vercel dashboard
5. **Configure custom domain**: Add your company domain
6. **Review logs**: Check Vercel dashboard for any errors
7. **Read full documentation**: See [README_DEPLOY.md](./README_DEPLOY.md)

---

## Troubleshooting

### Build fails
- Check Node.js version (requires 18+)
- Verify all dependencies are in `package.json`
- Review build logs in Vercel dashboard

### Database connection error
- Ensure Postgres is created and linked
- Check `DATABASE_URL` is set
- Verify region matches your deployment region

### Cron jobs not running
- Upgrade to Pro plan (Free plan = 1 cron/day)
- Check cron secret is configured
- Review cron logs in Vercel dashboard

### API returns 500 errors
- Check environment variables are set
- Review function logs in Vercel dashboard
- Verify APEC credentials are correct

---

## Support

- **Documentation**: [README_DEPLOY.md](./README_DEPLOY.md)
- **Vercel Docs**: https://vercel.com/docs
- **Issues**: https://github.com/your-username/apec-job-manager/issues

---

**Ready to deploy?** Click the button at the top of this page!
