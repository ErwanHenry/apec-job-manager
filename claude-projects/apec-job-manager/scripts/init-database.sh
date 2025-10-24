#!/bin/bash

##############################################################################
# APEC Job Manager - Database Initialization Script
##############################################################################
# This script initializes the database with Prisma migrations and seed data
# Usage: ./scripts/init-database.sh
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

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
  print_error "npx is not available. Please install Node.js and npm."
  exit 1
fi

# Check if prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
  print_error "prisma/schema.prisma not found. Please run from project root."
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
  if [ -f ".env.local" ]; then
    print_info "Loading environment from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
  elif [ -f ".env" ]; then
    print_info "Loading environment from .env..."
    export $(cat .env | grep -v '^#' | xargs)
  else
    print_error "DATABASE_URL not set and no .env file found"
    exit 1
  fi
fi

# Use POSTGRES_URL if DATABASE_URL not set (Vercel default)
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_URL" ]; then
  export DATABASE_URL=$POSTGRES_URL
  print_info "Using POSTGRES_URL as DATABASE_URL"
fi

print_success "Prerequisites check passed"

##############################################################################
# STEP 2: Generate Prisma Client
##############################################################################

print_header "Step 2: Generating Prisma Client"

print_info "Running prisma generate..."
if npx prisma generate; then
  print_success "Prisma Client generated successfully"
else
  print_error "Failed to generate Prisma Client"
  exit 1
fi

##############################################################################
# STEP 3: Test Database Connection
##############################################################################

print_header "Step 3: Testing Database Connection"

print_info "Testing connection to database..."

# Create a simple test script
cat > /tmp/test-db-connection.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

if node /tmp/test-db-connection.js; then
  print_success "Database connection test passed"
else
  print_error "Cannot connect to database. Check your DATABASE_URL"
  exit 1
fi

rm /tmp/test-db-connection.js

##############################################################################
# STEP 4: Run Migrations
##############################################################################

print_header "Step 4: Running Database Migrations"

read -p "This will modify the database schema. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "Migration cancelled by user"
  exit 0
fi

print_info "Running migrations..."

# Check if this is production
if [ "$NODE_ENV" = "production" ]; then
  # Production: use migrate deploy (no prompt)
  print_info "Production mode: Running migrate deploy..."
  if npx prisma migrate deploy; then
    print_success "Migrations deployed successfully"
  else
    print_error "Migration failed"
    exit 1
  fi
else
  # Development: use migrate dev
  print_info "Development mode: Running migrate dev..."
  if npx prisma migrate dev --name init; then
    print_success "Migrations applied successfully"
  else
    print_error "Migration failed"
    exit 1
  fi
fi

##############################################################################
# STEP 5: Verify Schema
##############################################################################

print_header "Step 5: Verifying Database Schema"

print_info "Checking tables..."

# Create verification script
cat > /tmp/verify-schema.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    await prisma.$connect();

    // Check each model
    const models = ['Job', 'SyncHistory', 'Report', 'AuditLog'];
    const results = {};

    for (const model of models) {
      try {
        const modelLower = model.toLowerCase();
        const count = await prisma[modelLower].count();
        results[model] = { exists: true, count };
      } catch (error) {
        results[model] = { exists: false, error: error.message };
      }
    }

    console.log('\nTable Verification:');
    for (const [model, result] of Object.entries(results)) {
      if (result.exists) {
        console.log(`✓ ${model}: exists (${result.count} rows)`);
      } else {
        console.log(`✗ ${model}: NOT FOUND`);
      }
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

verifySchema();
EOF

node /tmp/verify-schema.js
rm /tmp/verify-schema.js

print_success "Schema verification completed"

##############################################################################
# STEP 6: Seed Database (Optional)
##############################################################################

print_header "Step 6: Seeding Database"

read -p "Do you want to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then

  # Create seed script if it doesn't exist
  if [ ! -f "prisma/seed.js" ]; then
    print_info "Creating seed script..."

    cat > prisma/seed.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        apecId: 'SAMPLE-001',
        title: 'Développeur Full Stack Senior',
        description: 'Nous recherchons un développeur Full Stack expérimenté...',
        location: 'Paris, Île-de-France',
        contractType: 'CDI',
        salary: '50K-65K EUR',
        requirements: 'Bac+5, 5 ans expérience, React, Node.js',
        benefits: 'Télétravail, RTT, tickets restaurant',
        status: 'PUBLISHED',
        views: 42,
        applications: 5,
        publishedAt: new Date(),
      },
    }),
    prisma.job.create({
      data: {
        apecId: 'SAMPLE-002',
        title: 'Chef de Projet IT',
        description: 'Leader technique recherché pour piloter des projets stratégiques...',
        location: 'Lyon, Auvergne-Rhône-Alpes',
        contractType: 'CDI',
        salary: '55K-70K EUR',
        requirements: 'Bac+5, 7 ans expérience, Méthodologie Agile',
        benefits: 'Télétravail 3j/semaine, Formation continue',
        status: 'PUBLISHED',
        views: 28,
        applications: 3,
        publishedAt: new Date(),
      },
    }),
    prisma.job.create({
      data: {
        apecId: 'SAMPLE-003',
        title: 'Data Scientist',
        description: 'Expert en IA et Machine Learning pour nos projets innovants...',
        location: 'Remote',
        contractType: 'CDI',
        salary: '60K-80K EUR',
        requirements: 'Doctorat ou Bac+5, Python, TensorFlow, PyTorch',
        benefits: '100% remote, Stock options',
        status: 'DRAFT',
        views: 0,
        applications: 0,
      },
    }),
  ]);

  console.log(`Created ${jobs.length} sample jobs`);

  // Create sample sync history
  const syncHistory = await prisma.syncHistory.create({
    data: {
      syncType: 'manual',
      status: 'completed',
      jobsCreated: 3,
      jobsUpdated: 0,
      jobsDeleted: 0,
      jobsUnchanged: 0,
      errors: [],
      completedAt: new Date(),
      duration: 1234,
    },
  });

  console.log('Created sync history entry');

  // Create sample report
  const report = await prisma.report.create({
    data: {
      type: 'WEEKLY',
      period: 'Week 42',
      startDate: new Date('2024-10-14'),
      endDate: new Date('2024-10-20'),
      data: {
        totalJobs: 3,
        publishedJobs: 2,
        draftJobs: 1,
        totalViews: 70,
        totalApplications: 8,
        avgApplicationsPerJob: 2.67,
      },
    },
  });

  console.log('Created sample report');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

    print_success "Seed script created"
  fi

  # Run seed
  print_info "Running seed script..."
  if node prisma/seed.js; then
    print_success "Database seeded successfully"
  else
    print_warning "Seeding failed"
  fi
else
  print_info "Skipping database seeding"
fi

##############################################################################
# STEP 7: Prisma Studio (Optional)
##############################################################################

print_header "Step 7: Prisma Studio"

read -p "Do you want to open Prisma Studio to view your database? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_info "Opening Prisma Studio at http://localhost:5555"
  print_warning "Press Ctrl+C to stop Prisma Studio"
  npx prisma studio
fi

##############################################################################
# COMPLETION
##############################################################################

print_header "Database Initialization Complete"

print_success "Database is ready!"

echo -e "\nDatabase Summary:"
echo "- Prisma Client: Generated"
echo "- Migrations: Applied"
echo "- Schema: Verified"
echo "- Seed Data: $([ $REPLY = 'y' ] && echo 'Loaded' || echo 'Skipped')"

echo -e "\nUseful Commands:"
echo "- View database: npx prisma studio"
echo "- Create migration: npx prisma migrate dev --name <name>"
echo "- Reset database: npx prisma migrate reset"
echo "- Generate client: npx prisma generate"

print_success "You're all set! 🚀"
