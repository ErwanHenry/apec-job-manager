# Kaspa Community Tool - Detailed Guidelines

## 🚀 Overview

This is a multi-agent AI orchestrator built specifically for the Kaspa community, featuring **BlablaKAS** (carpooling/rideshare) and **KAScomodation** (accommodation) services. The system uses OpenAI GPT models with specialized agents to handle different aspects of community operations.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Agent System](#agent-system)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [RAG System](#rag-system)
- [Deployment](#deployment)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

### Core Components

1. **Agent Router** (`router.py`) - Routes user input to appropriate agents
2. **Agent System** (`agents.py`) - 4 specialized AI agents
3. **RAG System** (`rag.py`) - TF-IDF based document retrieval
4. **Social Scheduler** (`scheduler/`) - Automated posting system
5. **External Adapters** (`adapters/`) - Jira, Twitter/X, LinkedIn integration
6. **Workflow Engine** (`workflows.py`) - Multi-agent orchestration

### Data Flow

```
User Input → Router → Agent → OpenAI API → Validation → Response
                ↓
            RAG System (injects relevant docs)
                ↓
        External Tools (Jira, Social Media)
```

## 🤖 Agent System

### 1. Product Builder (`product_builder`)
**Purpose**: Transform ideas into development-ready product specifications

**Triggers Keywords**: `spec`, `user story`, `acceptation`, `feature`, `backlog`, `ticket`

**Output Schema**: `ProductSpec`
- Feature name and problem statement
- Scope (in/out)
- User stories (role/need/goal format)
- Acceptance criteria (Given/When/Then)
- Risk assessment
- Success metrics
- Jira tickets specifications

### 2. BlablaKAS Operations (`blablakas_ops`)
**Purpose**: Handle carpooling/rideshare support operations

**Trigger Keywords**: `faq`, `macro`, `support`, `incident`, `runbook`, `escalade`

**Output Schema**: `OpsPackage`
- Topic classification
- FAQs (question/answer pairs)
- Support macros (frontline/backline)
- Runbooks (step-by-step procedures)
- Escalation rules (condition/SLA)

### 3. KAScomodation Operations (`kascomodation_ops`)
**Purpose**: Manage accommodation planning and logistics

**Trigger Keywords**: `réservation`, `planning`, `hébergement`, `logistique`, `maintenance`

**Output Schema**: `AccommodationPlan`
- Reservation drafts (tentative/confirmed)
- Maintenance windows
- Overbooking risk assessment
- Resource management

### 4. Social Manager (`social_manager`)
**Purpose**: Create editorial calendars and social media content

**Trigger Keywords**: `post`, `linkedin`, `x`, `tweet`, `calendrier éditorial`, `campagne`

**Output Schema**: `SocialPlan`
- Campaign planning
- Platform-specific posts (X/LinkedIn)
- Scheduling (ISO-8601 timestamps)
- Approval workflows
- Performance reporting setup

## 🔌 API Endpoints

### Core Routes

#### 1. Intent Routing
```http
POST /route
Content-Type: application/json

{
  "text": "I need help with BlablaKAS carpooling support"
}

Response:
{
  "agent": "blablakas_ops"
}
```

#### 2. Agent Execution
```http
POST /agents/{agent_name}/act
Content-Type: application/json

{
  "input": "Create FAQ for car sharing cancellations"
}

Response: (Agent-specific schema)
{
  "topic": "car_sharing_cancellations",
  "faqs": [...],
  "macros": [...],
  "runbook": [...],
  "escalation": [...]
}
```

#### 3. Feature Launch Workflow
```http
POST /workflow/feature_launch
Content-Type: application/json

{
  "idea": "Real-time GPS tracking for BlablaKAS rides"
}

Response:
{
  "spec": {...},      // Product specification
  "tickets": {...},   // Created Jira tickets
  "social": {...}     // Scheduled announcements
}
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Social Media APIs
X_BEARER_TOKEN=your_twitter_bearer_token
LINKEDIN_ACCESS_TOKEN=your_linkedin_token
LINKEDIN_ORGANIZATION_URN=urn:li:organization:your-org-id

# Jira Integration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your_jira_token
JIRA_PROJECT_KEY=KASPA

# Application Settings
DRY_RUN=true          # Set to false for production
DEBUG=true
SCHEDULE_DB_PATH=schedule.db
```

### Jira Mapping (`config/jira_mapping.json`)

```json
{
  "default_issue_type": "Task",
  "label_to_issue_type": {
    "bug": "Bug",
    "enhancement": "Story",
    "security": "Security Issue"
  },
  "components": {
    "blablakas": "BlablaKAS Component",
    "kascomodation": "KAScomodation Component",
    "frontend": "Frontend",
    "backend": "Backend"
  }
}
```

## 📚 RAG System

### Directory Structure

```
rag/
├── blablakas_ops/
│   ├── policies.md
│   ├── procedures.md
│   └── faq_templates.md
├── kascomodation_ops/
│   ├── playbook.md
│   ├── booking_rules.md
│   └── maintenance_schedules.md
├── product_builder/
│   ├── style.md
│   ├── templates.md
│   └── security_guidelines.md
└── social_manager/
    ├── brand.md
    ├── content_calendar.md
    └── platform_guidelines.md
```

### How RAG Works

1. **Indexing**: TF-IDF vectorization of Markdown documents per agent
2. **Retrieval**: Cosine similarity search on user input
3. **Injection**: Top 3 relevant documents injected into agent prompts
4. **Context**: Agents use retrieved context to inform responses

### Content Guidelines

- **BlablaKAS Ops**: Support policies, escalation procedures, safety guidelines
- **KAScomodation Ops**: Booking procedures, property management, guest policies
- **Product Builder**: Development standards, security requirements, UI/UX guidelines
- **Social Manager**: Brand voice, posting schedules, community guidelines

## 🚀 Deployment

### Local Development

```bash
# Clone and setup
git clone <repository>
cd gpt_multiagent_python_openai_jira_social_plus

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Start application
uvicorn main:app --reload --port 8000
```

### Production Deployment

```bash
# Use production WSGI server
pip install gunicorn

# Start with multiple workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or use Docker
docker build -t kaspa-community-tool .
docker run -p 8000:8000 --env-file .env kaspa-community-tool
```

### Environment Checklist

- [ ] OpenAI API key configured and funded
- [ ] Social media API tokens (if using social features)
- [ ] Jira credentials (if using ticket creation)
- [ ] RAG documents populated with relevant content
- [ ] DRY_RUN=false for production
- [ ] Database permissions for SQLite scheduler
- [ ] HTTPS reverse proxy (nginx/CloudFlare)

## 📖 Usage Examples

### 1. BlablaKAS Support Case

```bash
# Route user request
curl -X POST "http://localhost:8000/route" \
  -H "Content-Type: application/json" \
  -d '{"text": "User complaining about ride cancellation, need support macro"}'

# Response: {"agent": "blablakas_ops"}

# Execute agent
curl -X POST "http://localhost:8000/agents/blablakas_ops/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Create support response for ride cancellation complaints"}'
```

### 2. KAScomodation Booking

```bash
curl -X POST "http://localhost:8000/agents/kascomodation_ops/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Plan accommodation for 5 guests, 3 nights in Prague, check-in March 15"}'
```

### 3. Feature Development Workflow

```bash
curl -X POST "http://localhost:8000/workflow/feature_launch" \
  -H "Content-Type: application/json" \
  -d '{"idea": "Add real-time chat feature to BlablaKAS for riders and drivers"}'
```

### 4. Social Media Campaign

```bash
curl -X POST "http://localhost:8000/agents/social_manager/act" \
  -H "Content-Type: application/json" \
  -d '{"input": "Create 1-week social media campaign announcing new KAScomodation partnership with hotels in Berlin"}'
```

## 🔧 Troubleshooting

### Common Issues

#### 1. OpenAI API Errors
```
Error: "Incorrect API key provided"
Solution: Check OPENAI_API_KEY in .env file
```

#### 2. Import Errors
```
Error: "ModuleNotFoundError: No module named 'agents'"
Solution: Activate virtual environment and install requirements
```

#### 3. Social Media Posting Fails
```
Error: "Unauthorized" when posting to X/LinkedIn
Solution: Check API tokens, ensure proper scopes/permissions
```

#### 4. Jira Integration Issues
```
Error: "Authentication failed" for Jira
Solution: Use API token, not password. Check base URL format
```

#### 5. Scheduler Not Working
```
Error: Posts not publishing automatically
Solution: Check SQLite permissions, verify scheduler startup in logs
```

### Debug Mode

Enable detailed logging:
```bash
export DEBUG=true
uvicorn main:app --reload --log-level debug
```

### Health Checks

```bash
# Test basic functionality
curl http://localhost:8000/route -d '{"text":"test"}' -H "Content-Type: application/json"

# Check agent availability
curl http://localhost:8000/agents/product_builder/act -d '{"input":"test"}' -H "Content-Type: application/json"
```

## 🔒 Security Considerations

### API Keys
- Never commit API keys to version control
- Use environment variables or secure key management
- Rotate keys regularly

### DRY_RUN Mode
- Always test with DRY_RUN=true first
- Prevents accidental posting/ticket creation
- Validates functionality without side effects

### Data Privacy
- Minimize personal data in prompts
- Follow GDPR guidelines for EU users
- Implement data retention policies

### Rate Limiting
- OpenAI: Respect rate limits
- Social Media APIs: Implement backoff strategies
- Jira: Consider API quotas

## 📊 Monitoring

### Key Metrics
- Agent response times
- OpenAI API usage/costs  
- Social media engagement
- Jira ticket creation rates
- RAG retrieval accuracy

### Logging
- Agent routing decisions
- External API calls
- Error rates and types
- Scheduler execution status

---

## 🆘 Support

For issues or questions:
1. Check logs for error details
2. Verify configuration settings
3. Test with DRY_RUN=true
4. Review RAG content quality
5. Monitor API quotas/limits

## 🔄 Updates

Keep your system updated:
- Monitor OpenAI model deprecations
- Update social media API versions
- Refresh RAG content regularly
- Review and update agent prompts