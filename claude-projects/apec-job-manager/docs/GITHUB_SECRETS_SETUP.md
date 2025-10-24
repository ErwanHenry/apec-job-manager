# GitHub Secrets Configuration Guide

This guide explains how to configure GitHub Secrets for the CI/CD pipeline.

## Required Secrets

Navigate to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

### 1. Vercel Secrets

#### VERCEL_TOKEN
Your Vercel authentication token for deployments.

**How to get it:**
```bash
# Login to Vercel CLI
vercel login

# Get your token
vercel token create github-actions
```

Or via Vercel Dashboard:
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create new token named "GitHub Actions"
3. Copy the token

#### VERCEL_ORG_ID
Your Vercel organization/team ID.

**How to get it:**
```bash
# Link project first
vercel link

# Get org ID from .vercel/project.json
cat .vercel/project.json | grep orgId
```

Or from Vercel Dashboard:
1. Go to your team settings
2. Copy the Team ID from the URL: `vercel.com/[YOUR-TEAM-NAME]/~settings`

#### VERCEL_PROJECT_ID
Your Vercel project ID.

**How to get it:**
```bash
# Get project ID from .vercel/project.json
cat .vercel/project.json | grep projectId
```

Or from Vercel Dashboard:
1. Go to Project Settings
2. Copy the Project ID from the General tab

### 2. Database Secrets

#### DATABASE_URL
Your production Postgres database URL (for running migrations in CI/CD).

**Format:**
```
postgresql://user:password@host:port/database?sslmode=require
```

**Get from Vercel:**
```bash
# Pull environment variables
vercel env pull .env.production

# Copy POSTGRES_URL value
cat .env.production | grep POSTGRES_URL
```

Or from Vercel Dashboard:
1. Go to Storage → Postgres → your database
2. Copy the connection string
3. Add as GitHub Secret

### 3. Optional Monitoring Secrets

#### CODECOV_TOKEN (Optional)
For code coverage reports.

**How to get it:**
1. Sign up at [Codecov](https://codecov.io)
2. Link your GitHub repository
3. Copy the upload token

#### SNYK_TOKEN (Optional)
For security vulnerability scanning.

**How to get it:**
1. Sign up at [Snyk](https://snyk.io)
2. Go to Account Settings → API Token
3. Copy the token

#### SLACK_WEBHOOK_URL (Optional)
For deployment notifications.

**How to get it:**
1. Go to [Slack API](https://api.slack.com/messaging/webhooks)
2. Create an incoming webhook
3. Copy the webhook URL

---

## Quick Setup Script

Save this as `scripts/setup-github-secrets.sh`:

```bash
#!/bin/bash

# GitHub Secrets Setup Script
# Requires: gh CLI (https://cli.github.com/)

set -e

echo "Setting up GitHub Secrets..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed"
  echo "Install from: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "Please authenticate with GitHub:"
  gh auth login
fi

# Vercel Token
echo "Enter your Vercel Token:"
read -s VERCEL_TOKEN
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"

# Vercel Org ID
echo "Enter your Vercel Org ID:"
read VERCEL_ORG_ID
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"

# Vercel Project ID
echo "Enter your Vercel Project ID:"
read VERCEL_PROJECT_ID
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"

# Database URL
echo "Enter your DATABASE_URL:"
read -s DATABASE_URL
gh secret set DATABASE_URL --body "$DATABASE_URL"

echo "✓ Required secrets configured!"

# Optional secrets
read -p "Configure optional secrets? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then

  read -p "Enter Codecov Token (or press Enter to skip): " CODECOV_TOKEN
  if [ ! -z "$CODECOV_TOKEN" ]; then
    gh secret set CODECOV_TOKEN --body "$CODECOV_TOKEN"
  fi

  read -p "Enter Snyk Token (or press Enter to skip): " SNYK_TOKEN
  if [ ! -z "$SNYK_TOKEN" ]; then
    gh secret set SNYK_TOKEN --body "$SNYK_TOKEN"
  fi

  read -p "Enter Slack Webhook URL (or press Enter to skip): " SLACK_WEBHOOK_URL
  if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL"
  fi

fi

echo "✓ GitHub Secrets setup complete!"
gh secret list
```

Make it executable and run:

```bash
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh
```

---

## Manual Setup via GitHub CLI

If you prefer to set secrets manually:

```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Ubuntu

# Authenticate
gh auth login

# Set secrets
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set DATABASE_URL

# Optional
gh secret set CODECOV_TOKEN
gh secret set SNYK_TOKEN
gh secret set SLACK_WEBHOOK_URL

# List all secrets
gh secret list
```

---

## Verifying Setup

After configuring secrets, verify they are set:

```bash
# List secrets (values are hidden)
gh secret list

# Expected output:
# VERCEL_TOKEN         Updated YYYY-MM-DD
# VERCEL_ORG_ID        Updated YYYY-MM-DD
# VERCEL_PROJECT_ID    Updated YYYY-MM-DD
# DATABASE_URL         Updated YYYY-MM-DD
```

---

## Testing the Pipeline

After setting up secrets, test the CI/CD pipeline:

```bash
# Create a test commit
git commit --allow-empty -m "test: trigger CI/CD pipeline"
git push

# Watch the workflow
gh run watch
```

Or view in browser:
1. Go to your repository
2. Click **"Actions"** tab
3. View the workflow run

---

## Security Best Practices

### 1. Rotate Secrets Regularly
- Rotate Vercel tokens every 90 days
- Update database credentials on schedule
- Revoke old tokens after rotation

### 2. Use Environment-Specific Secrets
For production and preview environments:

```bash
# Production secrets
gh secret set DATABASE_URL_PRODUCTION

# Preview secrets
gh secret set DATABASE_URL_PREVIEW
```

### 3. Audit Secret Usage
```bash
# View recent workflow runs
gh run list

# View specific run logs
gh run view <run-id> --log
```

### 4. Limit Secret Scope
- Only add secrets to repositories that need them
- Use organization secrets for shared credentials
- Use environment protection rules for production

---

## Troubleshooting

### Secret not found
```
Error: Secret VERCEL_TOKEN not found
```

**Solution:**
```bash
# Verify secret exists
gh secret list

# Re-add the secret
gh secret set VERCEL_TOKEN
```

### Vercel deployment fails
```
Error: Invalid token
```

**Solution:**
```bash
# Generate new token
vercel token create github-actions-new

# Update secret
gh secret set VERCEL_TOKEN
```

### Database connection error
```
Error: Connection to database failed
```

**Solution:**
- Verify DATABASE_URL format
- Check IP whitelist in Vercel Postgres
- Ensure database exists and is accessible

---

## Environment Variables vs Secrets

| Type | Use Case | Example |
|------|----------|---------|
| **Secrets** | Sensitive data (passwords, tokens) | `DATABASE_URL`, `VERCEL_TOKEN` |
| **Variables** | Non-sensitive config | `NODE_ENV`, `PORT` |

Set non-sensitive variables via:
```bash
gh variable set NODE_ENV --body "production"
gh variable set PORT --body "3000"
```

---

## Reference Links

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Tokens](https://vercel.com/docs/cli#commands/token)
- [GitHub CLI Secret Commands](https://cli.github.com/manual/gh_secret)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Complete Secret Checklist

- [ ] `VERCEL_TOKEN` - Vercel deployment token
- [ ] `VERCEL_ORG_ID` - Vercel organization ID
- [ ] `VERCEL_PROJECT_ID` - Vercel project ID
- [ ] `DATABASE_URL` - Postgres connection string
- [ ] `CODECOV_TOKEN` - Code coverage (optional)
- [ ] `SNYK_TOKEN` - Security scanning (optional)
- [ ] `SLACK_WEBHOOK_URL` - Notifications (optional)

---

Last updated: 2025-10-24
