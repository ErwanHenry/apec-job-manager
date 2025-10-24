#!/bin/bash

##############################################################################
# APEC Job Manager - Vercel Setup Script
##############################################################################
# This script automates the Vercel deployment setup process
# Usage: ./scripts/setup-vercel.sh
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

check_command() {
  if ! command -v $1 &> /dev/null; then
    print_error "$1 is not installed"
    return 1
  fi
  return 0
}

##############################################################################
# STEP 1: Check Prerequisites
##############################################################################

print_header "Step 1: Checking Prerequisites"

# Check Node.js
if check_command node; then
  NODE_VERSION=$(node -v)
  print_success "Node.js is installed: $NODE_VERSION"

  # Check if version >= 18
  NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required"
    exit 1
  fi
else
  print_error "Node.js is not installed. Please install Node.js 18+"
  exit 1
fi

# Check npm
if check_command npm; then
  NPM_VERSION=$(npm -v)
  print_success "npm is installed: $NPM_VERSION"
else
  print_error "npm is not installed"
  exit 1
fi

# Check git
if check_command git; then
  GIT_VERSION=$(git --version)
  print_success "Git is installed: $GIT_VERSION"
else
  print_error "Git is not installed"
  exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
  print_error "package.json not found. Please run this script from the project root directory."
  exit 1
fi

print_success "All prerequisites satisfied"

##############################################################################
# STEP 2: Install Dependencies
##############################################################################

print_header "Step 2: Installing Dependencies"

print_info "Installing root dependencies..."
npm install

print_info "Installing dashboard dependencies..."
cd dashboard && npm install && cd ..

print_success "Dependencies installed"

##############################################################################
# STEP 3: Check/Install Vercel CLI
##############################################################################

print_header "Step 3: Setting up Vercel CLI"

if check_command vercel; then
  VERCEL_VERSION=$(vercel --version)
  print_success "Vercel CLI is already installed: $VERCEL_VERSION"
else
  print_info "Installing Vercel CLI..."
  npm install -g vercel
  print_success "Vercel CLI installed"
fi

##############################################################################
# STEP 4: Vercel Login
##############################################################################

print_header "Step 4: Vercel Authentication"

print_info "Checking Vercel authentication status..."
if vercel whoami &> /dev/null; then
  VERCEL_USER=$(vercel whoami)
  print_success "Already logged in as: $VERCEL_USER"
else
  print_info "Please log in to Vercel..."
  vercel login
  print_success "Logged in to Vercel"
fi

##############################################################################
# STEP 5: Link Vercel Project
##############################################################################

print_header "Step 5: Linking Vercel Project"

if [ -d ".vercel" ]; then
  print_warning "Project already linked to Vercel"
  read -p "Do you want to re-link? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf .vercel
    vercel link
  fi
else
  print_info "Linking project to Vercel..."
  vercel link
  print_success "Project linked"
fi

##############################################################################
# STEP 6: Environment Variables
##############################################################################

print_header "Step 6: Environment Variables Setup"

if [ ! -f ".env" ]; then
  print_info "Creating .env from .env.example..."
  cp .env.example .env
  print_warning "Please edit .env file with your actual values"
  print_info "Opening .env in default editor..."

  if [ -n "$EDITOR" ]; then
    $EDITOR .env
  elif command -v nano &> /dev/null; then
    nano .env
  elif command -v vim &> /dev/null; then
    vim .env
  else
    print_warning "No editor found. Please edit .env manually."
  fi
else
  print_success ".env file already exists"
fi

# Generate secrets
print_info "Generating secure secrets..."

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo -e "\n${GREEN}Generated Secrets (save these):${NC}"
echo "JWT_SECRET=$JWT_SECRET"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "CRON_SECRET=$CRON_SECRET"

# Ask if user wants to push env vars to Vercel
read -p "Do you want to push environment variables to Vercel now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_info "Pushing environment variables to Vercel..."

  # Push critical variables
  echo "$JWT_SECRET" | vercel env add JWT_SECRET production
  echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production
  echo "$CRON_SECRET" | vercel env add CRON_SECRET production

  print_success "Core environment variables pushed"
  print_warning "You still need to add APEC credentials manually in Vercel dashboard"
fi

##############################################################################
# STEP 7: Vercel Postgres
##############################################################################

print_header "Step 7: Setting up Vercel Postgres"

print_info "Creating Postgres database..."
read -p "Enter region (cdg1 for Paris, fra1 for Frankfurt): " REGION
REGION=${REGION:-cdg1}

if vercel postgres create apec-job-manager-db --region $REGION; then
  print_success "Postgres database created"
else
  print_warning "Database creation failed or already exists"
fi

##############################################################################
# STEP 8: Vercel KV (Redis)
##############################################################################

print_header "Step 8: Setting up Vercel KV (Redis)"

print_info "Creating KV store..."
if vercel kv create apec-job-manager-kv --region $REGION; then
  print_success "KV store created"
else
  print_warning "KV creation failed or already exists"
fi

##############################################################################
# STEP 9: Vercel Blob Storage
##############################################################################

print_header "Step 9: Setting up Vercel Blob Storage"

print_info "Creating Blob storage..."
if vercel blob create apec-job-manager-blob; then
  print_success "Blob storage created"
else
  print_warning "Blob creation failed or already exists"
fi

##############################################################################
# STEP 10: Pull Environment Variables
##############################################################################

print_header "Step 10: Pulling Environment Variables"

print_info "Pulling environment variables from Vercel..."
vercel env pull .env.local
print_success "Environment variables pulled to .env.local"

##############################################################################
# STEP 11: Database Setup
##############################################################################

print_header "Step 11: Database Setup"

print_info "Generating Prisma Client..."
npx prisma generate
print_success "Prisma Client generated"

print_info "Running database migrations..."
if npx prisma migrate deploy; then
  print_success "Database migrations completed"
else
  print_warning "Migrations failed. You may need to run them after first deployment."
fi

##############################################################################
# STEP 12: Build Test
##############################################################################

print_header "Step 12: Testing Build"

print_info "Testing root build..."
if npm run build; then
  print_success "Root build successful"
else
  print_error "Root build failed"
fi

print_info "Testing dashboard build..."
cd dashboard
if npm run build; then
  print_success "Dashboard build successful"
else
  print_error "Dashboard build failed"
fi
cd ..

##############################################################################
# STEP 13: Deploy to Vercel
##############################################################################

print_header "Step 13: Deploy to Vercel"

read -p "Do you want to deploy to production now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_info "Deploying to Vercel production..."
  vercel --prod
  print_success "Deployment initiated"
else
  print_info "Skipping deployment. Run 'vercel --prod' when ready."
fi

##############################################################################
# STEP 14: Post-Deployment Checks
##############################################################################

print_header "Step 14: Post-Deployment Checklist"

echo -e "${GREEN}Setup completed successfully!${NC}\n"

echo "Next steps:"
echo "1. Configure APEC credentials in Vercel dashboard"
echo "2. Test your deployment at your Vercel URL"
echo "3. Check /api/health endpoint"
echo "4. Configure optional services (SMTP, Slack, Sentry)"
echo "5. Set up monitoring and alerts"

echo -e "\nImportant URLs:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Environment Variables: https://vercel.com/[your-team]/apec-job-manager/settings/environment-variables"
echo "- Deployments: https://vercel.com/[your-team]/apec-job-manager"

echo -e "\nGenerated Secrets (save these securely):"
echo "JWT_SECRET=$JWT_SECRET"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "CRON_SECRET=$CRON_SECRET"

print_success "All done! Happy deploying! 🚀"
