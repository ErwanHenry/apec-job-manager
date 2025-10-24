#!/bin/bash

##############################################################################
# APEC Job Manager - GitHub Secrets Setup Script
##############################################################################
# This script configures GitHub Secrets for CI/CD pipeline
# Requires: GitHub CLI (gh) - https://cli.github.com/
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
  echo -e "\n${BLUE}===================================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

##############################################################################
# STEP 1: Check Prerequisites
##############################################################################

print_header "Step 1: Checking Prerequisites"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  print_error "GitHub CLI (gh) is not installed"
  echo ""
  echo "Install GitHub CLI:"
  echo "  macOS:   brew install gh"
  echo "  Ubuntu:  sudo apt install gh"
  echo "  Windows: winget install --id GitHub.cli"
  echo ""
  echo "Or visit: https://cli.github.com/"
  exit 1
fi

GH_VERSION=$(gh --version | head -n 1)
print_success "GitHub CLI installed: $GH_VERSION"

# Check if authenticated
print_info "Checking GitHub authentication..."
if gh auth status &> /dev/null; then
  GH_USER=$(gh api user --jq '.login')
  print_success "Authenticated as: $GH_USER"
else
  print_warning "Not authenticated with GitHub"
  print_info "Starting authentication flow..."
  gh auth login
  GH_USER=$(gh api user --jq '.login')
  print_success "Authenticated as: $GH_USER"
fi

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  print_error "Not in a git repository"
  exit 1
fi

REPO_NAME=$(gh repo view --json name --jq '.name')
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
print_success "Repository: $REPO_OWNER/$REPO_NAME"

##############################################################################
# STEP 2: Vercel Secrets
##############################################################################

print_header "Step 2: Vercel Secrets"

echo "You need the following Vercel information:"
echo "1. Vercel Token (from: https://vercel.com/account/tokens)"
echo "2. Vercel Org ID (from: vercel link or .vercel/project.json)"
echo "3. Vercel Project ID (from: vercel link or .vercel/project.json)"
echo ""

# Check if .vercel directory exists
if [ -d ".vercel" ] && [ -f ".vercel/project.json" ]; then
  print_info "Found .vercel/project.json"

  VERCEL_ORG_ID=$(cat .vercel/project.json | grep -o '"orgId": "[^"]*"' | cut -d'"' -f4)
  VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId": "[^"]*"' | cut -d'"' -f4)

  if [ ! -z "$VERCEL_ORG_ID" ]; then
    print_success "Auto-detected Vercel Org ID: $VERCEL_ORG_ID"
  fi

  if [ ! -z "$VERCEL_PROJECT_ID" ]; then
    print_success "Auto-detected Vercel Project ID: $VERCEL_PROJECT_ID"
  fi
fi

# VERCEL_TOKEN
print_info "Setting VERCEL_TOKEN..."
if gh secret list | grep -q "VERCEL_TOKEN"; then
  print_warning "VERCEL_TOKEN already exists"
  read -p "Update VERCEL_TOKEN? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enter your Vercel Token (hidden):"
    read -s VERCEL_TOKEN
    echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN
    print_success "VERCEL_TOKEN updated"
  fi
else
  echo "Enter your Vercel Token (hidden):"
  read -s VERCEL_TOKEN
  echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN
  print_success "VERCEL_TOKEN set"
fi

# VERCEL_ORG_ID
print_info "Setting VERCEL_ORG_ID..."
if [ -z "$VERCEL_ORG_ID" ]; then
  echo "Enter your Vercel Org ID:"
  read VERCEL_ORG_ID
fi

echo "$VERCEL_ORG_ID" | gh secret set VERCEL_ORG_ID
print_success "VERCEL_ORG_ID set: $VERCEL_ORG_ID"

# VERCEL_PROJECT_ID
print_info "Setting VERCEL_PROJECT_ID..."
if [ -z "$VERCEL_PROJECT_ID" ]; then
  echo "Enter your Vercel Project ID:"
  read VERCEL_PROJECT_ID
fi

echo "$VERCEL_PROJECT_ID" | gh secret set VERCEL_PROJECT_ID
print_success "VERCEL_PROJECT_ID set: $VERCEL_PROJECT_ID"

##############################################################################
# STEP 3: Database Secret
##############################################################################

print_header "Step 3: Database Secret"

echo "You need your Vercel Postgres DATABASE_URL"
echo "Get it from: Vercel Dashboard → Storage → Postgres → .env.local tab"
echo "Or run: vercel env pull .env.local"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
  print_info "Found .env.local file"

  DATABASE_URL=$(cat .env.local | grep '^POSTGRES_URL=' | cut -d'=' -f2-)

  if [ ! -z "$DATABASE_URL" ]; then
    print_success "Auto-detected DATABASE_URL from .env.local"
    echo "Using: ${DATABASE_URL:0:30}... (truncated)"

    read -p "Use this DATABASE_URL? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
      echo "$DATABASE_URL" | gh secret set DATABASE_URL
      print_success "DATABASE_URL set from .env.local"
    else
      echo "Enter your DATABASE_URL (hidden):"
      read -s DATABASE_URL
      echo "$DATABASE_URL" | gh secret set DATABASE_URL
      print_success "DATABASE_URL set"
    fi
  else
    echo "Enter your DATABASE_URL (hidden):"
    read -s DATABASE_URL
    echo "$DATABASE_URL" | gh secret set DATABASE_URL
    print_success "DATABASE_URL set"
  fi
else
  echo "Enter your DATABASE_URL (hidden):"
  read -s DATABASE_URL
  echo "$DATABASE_URL" | gh secret set DATABASE_URL
  print_success "DATABASE_URL set"
fi

##############################################################################
# STEP 4: Optional Secrets
##############################################################################

print_header "Step 4: Optional Secrets"

read -p "Do you want to configure optional secrets? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then

  # CODECOV_TOKEN
  print_info "Codecov Token (for code coverage)"
  echo "Get it from: https://codecov.io"
  read -p "Enter Codecov Token (or press Enter to skip): " CODECOV_TOKEN
  if [ ! -z "$CODECOV_TOKEN" ]; then
    echo "$CODECOV_TOKEN" | gh secret set CODECOV_TOKEN
    print_success "CODECOV_TOKEN set"
  else
    print_info "Skipping CODECOV_TOKEN"
  fi

  # SNYK_TOKEN
  print_info "Snyk Token (for security scanning)"
  echo "Get it from: https://snyk.io → Account Settings → API Token"
  read -p "Enter Snyk Token (or press Enter to skip): " SNYK_TOKEN
  if [ ! -z "$SNYK_TOKEN" ]; then
    echo "$SNYK_TOKEN" | gh secret set SNYK_TOKEN
    print_success "SNYK_TOKEN set"
  else
    print_info "Skipping SNYK_TOKEN"
  fi

  # SLACK_WEBHOOK_URL
  print_info "Slack Webhook URL (for notifications)"
  echo "Get it from: https://api.slack.com/messaging/webhooks"
  read -p "Enter Slack Webhook URL (or press Enter to skip): " SLACK_WEBHOOK_URL
  if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    echo "$SLACK_WEBHOOK_URL" | gh secret set SLACK_WEBHOOK_URL
    print_success "SLACK_WEBHOOK_URL set"
  else
    print_info "Skipping SLACK_WEBHOOK_URL"
  fi

else
  print_info "Skipping optional secrets"
fi

##############################################################################
# STEP 5: Summary
##############################################################################

print_header "Step 5: Summary"

print_info "Listing all configured secrets..."
gh secret list

echo ""
print_success "GitHub Secrets setup complete!"

echo ""
echo "Required secrets configured:"
echo "  ✓ VERCEL_TOKEN"
echo "  ✓ VERCEL_ORG_ID"
echo "  ✓ VERCEL_PROJECT_ID"
echo "  ✓ DATABASE_URL"

echo ""
echo "Next steps:"
echo "1. Push code to trigger GitHub Actions:"
echo "   git commit --allow-empty -m 'test: trigger CI/CD'"
echo "   git push"
echo ""
echo "2. View workflow runs:"
echo "   gh run list"
echo "   gh run watch"
echo ""
echo "3. Check Vercel deployment:"
echo "   vercel ls"

print_success "All done! 🚀"
