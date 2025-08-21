# 🚀 Deployment Guide - Kaspa Community Tool

## Vue d'ensemble du Déploiement

Ce guide couvre tous les aspects du déploiement du Kaspa Community Tool, des environnements de développement local aux déploiements en production à grande échelle.

## Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   CDN       │    │Load Balancer│    │   Firewall  │         │
│  │ (Cloudflare)│    │  (Nginx)    │    │  (AWS WAF)  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 API Tier                                │   │
│  │                                                         │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │ │Vercel Funcs │  │FastAPI Core │  │WebSocket API│     │   │
│  │ │(Node.js)    │  │ (Python)    │  │ (Python)    │     │   │
│  │ └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Service Tier                            │   │
│  │                                                         │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │ │Multi-Agents │  │ RAG System  │  │ Scheduler   │     │   │
│  │ │   Engine    │  │  (Vector)   │  │  Service    │     │   │
│  │ └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Data Tier                               │   │
│  │                                                         │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │ │ PostgreSQL  │  │   Redis     │  │   S3        │     │   │
│  │ │ (Primary)   │  │  (Cache)    │  │ (Storage)   │     │   │
│  │ └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                External APIs                            │   │
│  │                                                         │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │ │ OpenAI API  │  │  Jira API   │  │Social Media │     │   │
│  │ │             │  │             │  │APIs (X,LI)  │     │   │
│  │ └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Environnements

### 🔧 Développement Local

#### Configuration rapide

```bash
# 1. Clone du repository
git clone https://github.com/ErwanHenry/kaspa-community-tool.git
cd kaspa-community-tool

# 2. Setup Python environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# 3. Installation dépendances
pip install -r requirements-local.txt

# 4. Variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés

# 5. Démarrage
uvicorn main:app --reload --port 8000
```

#### Configuration avancée avec Docker

```dockerfile
# Dockerfile.dev
FROM python:3.9-slim

# Dependencies système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements-local.txt .
RUN pip install --no-cache-dir -r requirements-local.txt

# Application code
COPY . .

# Port
EXPOSE 8000

# Hot reload en développement
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=development
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DEBUG=true
    volumes:
      - .:/app
      - /app/.venv
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=kaspa_community_tool
      - POSTGRES_USER=kct_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

#### Commandes de développement

```bash
# Démarrage avec Docker
docker-compose up -d

# Tests unitaires
python -m pytest tests/ -v

# Linting et formatting
black .
flake8 .
mypy .

# Tests d'intégration
python -m pytest tests/integration/ -v

# Génération de documentation
python -m sphinx docs/ docs/_build/
```

### 🧪 Environnement de Test (Staging)

#### Configuration CI/CD avec GitHub Actions

```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python 3.9
      uses: actions/setup-python@v4
      with:
        python-version: 3.9
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements-local.txt
    
    - name: Run tests
      run: |
        python -m pytest tests/ --cov=./ --cov-report=xml
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Staging
      run: |
        # Deploy to staging environment
        curl -X POST "https://api.staging.kaspa-community-tool.com/deploy" \
          -H "Authorization: Bearer ${{ secrets.STAGING_DEPLOY_TOKEN }}" \
          -d '{"ref": "${{ github.sha }}"}'
```

#### Configuration Staging

```bash
# Variables d'environnement staging
export ENVIRONMENT=staging
export API_URL=https://staging.kaspa-community-tool.com
export OPENAI_API_KEY=sk-staging-...
export DB_URL=postgresql://staging_user:pass@staging-db:5432/kct_staging
export REDIS_URL=redis://staging-redis:6379/0
export LOG_LEVEL=INFO
```

#### Infrastructure Staging (Terraform)

```hcl
# terraform/staging/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_ecs_cluster" "kct_staging" {
  name = "kaspa-community-tool-staging"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "kct_api" {
  family                   = "kct-api-staging"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "kct-api"
      image = "${aws_ecr_repository.kct.repository_url}:latest"
      
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = "staging"
        }
      ]

      secrets = [
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_ssm_parameter.openai_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"  = aws_cloudwatch_log_group.kct.name
          "awslogs-region" = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}
```

### 🌐 Production Vercel

#### Configuration Vercel

```json
{
  "name": "kaspa-community-tool",
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/",
      "dest": "/api/index.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/$1.js"
    }
  ],
  "env": {
    "ENVIRONMENT": "production"
  },
  "build": {
    "env": {
      "NODE_VERSION": "18.x"
    }
  },
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1", "lhr1", "sfo1"]
}
```

#### Variables d'environnement Vercel

```bash
# Configuration via Vercel CLI
vercel env add OPENAI_API_KEY production
vercel env add JIRA_API_TOKEN production
vercel env add TWITTER_API_KEY production
vercel env add LINKEDIN_API_KEY production
vercel env add WEBHOOK_SECRET production

# Ou via dashboard Vercel
# Settings > Environment Variables
```

#### Optimisations Vercel

```javascript
// api/index.js - Optimisé pour Vercel
export default async function handler(req, res) {
  // Cache headers
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Gestion des OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Logique métier...
    const response = await processRequest(req);
    res.status(200).json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
}

// Edge Runtime pour performances
export const config = {
  runtime: 'edge',
  regions: ['iad1', 'lhr1', 'sfo1']
};
```

### ☁️ Production AWS

#### ECS avec Fargate

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - ENVIRONMENT=production
      - PORT=8000
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 1G
        reservations:
          cpus: '0.25'
          memory: 512M
      restart_policy:
        condition: on-failure
        max_attempts: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    deploy:
      replicas: 2

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod:/data
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]

volumes:
  redis_prod:
    external: true
```

#### Dockerfile Production

```dockerfile
# Dockerfile.prod
FROM python:3.9-slim as builder

# Build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production image
FROM python:3.9-slim

# Security updates
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd -r kct && useradd -r -g kct kct

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /root/.local /home/kct/.local

# Application code
COPY --chown=kct:kct . .

USER kct

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Port
EXPOSE 8000

# Start command
CMD ["python", "-m", "gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### Configuration Load Balancer

```nginx
# nginx.conf
upstream kct_api {
    least_conn;
    server api:8000 max_fails=3 fail_timeout=30s;
    server api:8000 max_fails=3 fail_timeout=30s;
    server api:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name kaspa-community-tool.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kaspa-community-tool.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to API
    location / {
        proxy_pass http://kct_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Health checks
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://kct_api/health;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

## Base de Données

### 🐘 PostgreSQL Production

#### Configuration HA

```yaml
# postgres-ha.yml
version: '3.8'
services:
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kaspa_community_tool
      POSTGRES_USER: kct_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPL_PASSWORD}
    volumes:
      - postgres_primary:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf
      - ./pg_hba.conf:/etc/postgresql/pg_hba.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    ports:
      - "5432:5432"

  postgres-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: kct_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_replica:/var/lib/postgresql/data
    command: |
      bash -c "
      until pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U replicator -v -P -W; do
        echo 'Waiting for primary to be available...'
        sleep 1s
      done
      echo 'standby_mode = on' >> /var/lib/postgresql/data/recovery.conf
      echo 'primary_conninfo = \"host=postgres-primary port=5432 user=replicator\"' >> /var/lib/postgresql/data/recovery.conf
      postgres
      "
    depends_on:
      - postgres-primary
```

#### Migrations Alembic

```python
# alembic/versions/001_initial_schema.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None

def upgrade():
    # Agents table
    op.create_table('agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Agent executions
    op.create_table('agent_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('input_text', sa.Text(), nullable=False),
        sa.Column('output_json', postgresql.JSONB(), nullable=True),
        sa.Column('execution_time', sa.Float(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agents.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Social media posts
    op.create_table('social_posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('media_urls', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(), nullable=False),
        sa.Column('posted_at', sa.DateTime(), nullable=True),
        sa.Column('post_id', sa.String(100), nullable=True),
        sa.Column('engagement_metrics', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('social_posts')
    op.drop_table('agent_executions')
    op.drop_table('agents')
```

#### Backup et Restauration

```bash
#!/bin/bash
# scripts/backup.sh

# Configuration
DB_HOST="production-postgres.amazonaws.com"
DB_NAME="kaspa_community_tool"
DB_USER="kct_user"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="kct_backup_${DATE}.sql"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" "s3://kct-backups/db/${BACKUP_FILE}.gz"

# Cleanup local files older than 7 days
find $BACKUP_DIR -name "kct_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 🟥 Redis Configuration

```conf
# redis.conf
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass ${REDIS_PASSWORD}

# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "CONFIG_9a8b7c6d"

# Logging
loglevel notice
logfile "/var/log/redis/redis-server.log"

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
```

## Monitoring et Observabilité

### 📊 Prometheus + Grafana

```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

volumes:
  prometheus_data:
  grafana_data:
```

#### Métriques Custom

```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps

# Counters
AGENT_REQUESTS = Counter('agent_requests_total', 'Total agent requests', ['agent', 'status'])
API_REQUESTS = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method', 'status'])

# Histograms
AGENT_DURATION = Histogram('agent_execution_seconds', 'Agent execution time', ['agent'])
API_DURATION = Histogram('api_request_seconds', 'API request time', ['endpoint'])

# Gauges
ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
OPENAI_TOKENS = Gauge('openai_tokens_used', 'OpenAI tokens consumed', ['agent'])

def monitor_agent_execution(agent_name):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                AGENT_REQUESTS.labels(agent=agent_name, status='success').inc()
                return result
            except Exception as e:
                AGENT_REQUESTS.labels(agent=agent_name, status='error').inc()
                raise
            finally:
                AGENT_DURATION.labels(agent=agent_name).observe(time.time() - start_time)
        return wrapper
    return decorator

# Usage dans les agents
@monitor_agent_execution('product_builder')
async def product_builder_act(input_text: str):
    # Logique de l'agent...
    pass
```

### 📝 Logging Structure

```python
# logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'agent_name'):
            log_entry['agent_name'] = record.agent_name
            
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
            
        return json.dumps(log_entry)

# Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/kct/app.log')
    ]
)

# Set formatter
for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())

# Usage
logger = logging.getLogger(__name__)
logger.info(
    "Agent execution completed", 
    extra={
        'agent_name': 'product_builder',
        'execution_time': 2.34,
        'tokens_used': 1567,
        'request_id': 'req_abc123'
    }
)
```

### 🚨 Alerting

```yaml
# alertmanager/config.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@kaspa-community-tool.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  email_configs:
  - to: 'team@kaspa-community-tool.com'
    subject: 'KCT Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      Labels: {{ range .Labels.SortedPairs }}{{ .Name }}: {{ .Value }}{{ end }}
      {{ end }}
      
  slack_configs:
  - api_url: '${SLACK_WEBHOOK_URL}'
    channel: '#alerts'
    title: 'KCT Production Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

## Sécurité et Compliance

### 🔒 Configuration Sécurité

```python
# security/config.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import jwt
from datetime import datetime, timedelta

app = FastAPI()

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=[
        "kaspa-community-tool.com", 
        "*.kaspa-community-tool.com",
        "localhost"
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kaspa-community-tool.com",
        "https://app.kaspa-community-tool.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# Rate limiting middleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# Authentication
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Protected endpoint
@app.post("/agents/{agent_name}/act")
@limiter.limit("10/minute")
async def act_agent(
    request: Request,
    agent_name: str,
    body: dict,
    user: dict = Depends(verify_token)
):
    # Implementation...
    pass
```

### 🛡️ Secrets Management

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name "kct/production/openai-key" \
  --description "OpenAI API Key for production" \
  --secret-string "sk-proj-..."

# Kubernetes Secrets
kubectl create secret generic kct-secrets \
  --from-literal=openai-api-key=sk-proj-... \
  --from-literal=db-password=supersecret \
  --from-literal=jwt-secret=jwtsecret123
```

```python
# secrets/manager.py
import boto3
import json
from functools import lru_cache

class SecretManager:
    def __init__(self):
        self.client = boto3.client('secretsmanager', region_name='us-east-1')
    
    @lru_cache(maxsize=100)
    def get_secret(self, secret_name: str) -> str:
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            return response['SecretString']
        except Exception as e:
            raise Exception(f"Failed to retrieve secret {secret_name}: {e}")
    
    def get_openai_key(self) -> str:
        return self.get_secret("kct/production/openai-key")
    
    def get_db_password(self) -> str:
        return self.get_secret("kct/production/db-password")

secrets = SecretManager()
```

## Troubleshooting Déploiement

### 🐛 Problèmes Courants

#### 1. Erreur Build Docker

```bash
# Problème: pip install fails
ERROR: Could not install packages due to an EnvironmentError

# Solution: Update base image et clear cache
FROM python:3.9-slim
RUN apt-get update && apt-get upgrade -y
RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

#### 2. Memory Issues

```yaml
# docker-compose.yml - Limites de mémoire
services:
  api:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### 3. Database Connection Pool

```python
# Connection pooling configuration
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

### 📊 Health Checks

```python
# health.py
from fastapi import APIRouter, HTTPException
import psutil
import aioredis
from sqlalchemy import text

router = APIRouter()

@router.get("/health")
async def health_check():
    checks = {
        "api": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Database check
    try:
        async with database.transaction():
            result = await database.fetch_one("SELECT 1 as health")
            checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {e}"
    
    # Redis check
    try:
        redis = await aioredis.from_url(REDIS_URL)
        await redis.ping()
        checks["redis"] = "healthy"
        await redis.close()
    except Exception as e:
        checks["redis"] = f"unhealthy: {e}"
    
    # System resources
    checks["system"] = {
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_percent": psutil.disk_usage('/').percent
    }
    
    # OpenAI API check
    try:
        # Simple API test
        checks["openai"] = "healthy"
    except Exception as e:
        checks["openai"] = f"unhealthy: {e}"
    
    # Overall status
    unhealthy_services = [k for k, v in checks.items() 
                         if isinstance(v, str) and "unhealthy" in v]
    
    if unhealthy_services:
        raise HTTPException(
            status_code=503, 
            detail={"status": "unhealthy", "checks": checks}
        )
    
    return {"status": "healthy", "checks": checks}
```

### 🔧 Scripts de Déploiement

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo "🚀 Deploying Kaspa Community Tool to $ENVIRONMENT"

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
python scripts/pre_deploy_checks.py --env $ENVIRONMENT

# Database migrations
echo "🗃️ Running database migrations..."
alembic upgrade head

# Build and push Docker images
echo "🐳 Building Docker images..."
docker build -t kct-api:$VERSION .
docker tag kct-api:$VERSION registry.example.com/kct-api:$VERSION
docker push registry.example.com/kct-api:$VERSION

# Deploy to Kubernetes/ECS
echo "☸️ Deploying to $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    kubectl apply -f k8s/production/
    kubectl rollout status deployment/kct-api
else
    kubectl apply -f k8s/staging/
    kubectl rollout status deployment/kct-api-staging
fi

# Post-deployment verification
echo "✅ Running post-deployment tests..."
python scripts/post_deploy_tests.py --env $ENVIRONMENT --version $VERSION

# Update monitoring
echo "📊 Updating monitoring dashboards..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_TOKEN" \
  -d @monitoring/dashboard.json

echo "🎉 Deployment completed successfully!"
```

---

**Dernière mise à jour** : 17 août 2025  
**Version** : 1.0  
**Support** : devops@kaspa-community-tool.com