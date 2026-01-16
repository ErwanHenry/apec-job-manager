# FinanceTracker - Personal Finance Management API

A hexagonal architecture-based personal finance management tool for tracking transactions, automatic categorization, and balance projection.

**Status:** Sprint 1 MVP Complete ✅

## Quick Start

### 1. Setup Environment

```bash
# Clone the repository (if not already done)
cd backend

# Create and activate virtual environment
python3.11 -m venv venv
. venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Initialize Database

```bash
# Seed database with default categories and sample accounts
python scripts/seed_data.py
```

Output:
```
==================================================
🌱 Seeding FinanceTracker database
==================================================
✅ Database tables created
Creating default categories...
  ✓ Created category: Revenus > Salaire
  ✓ Created category: Revenus > Freelance
  ... (more categories)
Creating sample accounts...
  ✓ Created account: LCL Courant (LCL)
  ✓ Created account: Livret A
✅ Database seeding completed!
```

### 3. Start API Server

```bash
# Development mode with auto-reload
uvicorn src.main:app --reload

# Or production mode
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Server starts at: `http://localhost:8000`

### 4. Access API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## API Endpoints

### Accounts

```bash
# List all accounts
GET /api/v1/accounts

# Create account
POST /api/v1/accounts
{
  "name": "Mon Compte",
  "bank": "LCL",
  "account_type": "checking",
  "initial_balance": "2500.00",
  "currency": "EUR"
}

# Get account by ID
GET /api/v1/accounts/{account_id}
```

### Import Transactions

```bash
# Import CSV file
POST /api/v1/import
Content-Type: multipart/form-data

Parameters:
- file: CSV file to import
- account_id: UUID of target account
- auto_categorize: true/false (default: true)

Response:
{
  "account_id": "uuid",
  "imported_count": 10,
  "skipped_count": 2,
  "error_count": 0,
  "categorized_count": 8,
  "total_processed": 12,
  "success_rate": 83.33,
  "categorization_rate": 80.0,
  "errors": []
}
```

### Transactions

```bash
# List transactions with pagination and filtering
GET /api/v1/transactions?account_id={id}&page=1&size=100

Query parameters:
- account_id: Filter by account (optional)
- date_from: Filter from date YYYY-MM-DD (optional)
- date_to: Filter to date YYYY-MM-DD (optional)
- category_id: Filter by category (optional)
- page: Page number (default: 1)
- size: Items per page (default: 100, max: 500)

# Get transaction by ID
GET /api/v1/transactions/{transaction_id}

# Update transaction category
PUT /api/v1/transactions/{transaction_id}/category
{
  "category_id": "uuid",
  "notes": "Updated notes",
  "tags": ["tag1", "tag2"]
}
```

### Projection

```bash
# Get balance projection
GET /api/v1/projection?months=6&scenario=realistic

Query parameters:
- months: Number of months to project (1-12, default: 6)
- scenario: pessimistic, realistic, or optimistic (default: realistic)

Response:
{
  "scenario": "realistic",
  "starting_balance": "2500.00",
  "ending_balance": "2650.00",
  "min_balance": "2100.00",
  "max_balance": "2650.00",
  "average_balance": "2400.00",
  "total_change": "150.00",
  "is_critical": false,
  "is_warning": false,
  "is_healthy": true,
  "is_improving": true,
  "num_days": 180,
  "num_negative_days": 0,
  "percentage_negative_days": 0.0,
  "projection_points": [
    {
      "date": "2025-02-01",
      "balance": "2450.00",
      "net_change": "-50.00"
    },
    ...
  ]
}
```

## CSV Import Format

### LCL Bank Export

FinanceTracker supports LCL CSV format with the following structure:

```csv
Date;Date valeur;Libellé;Débit;Crédit
15/01/2025;15/01/2025;CB CARREFOUR;42,50;
20/01/2025;20/01/2025;VIR SEPA CAF;;2400,00
22/01/2025;22/01/2025;CB MONOPRIX;35,75;
```

**Features:**
- ✅ Automatic deduplication via import_hash
- ✅ French decimal format support (1 234,56)
- ✅ Automatic encoding detection (UTF-8, ISO-8859-1)
- ✅ Debit/Credit column handling
- ✅ Date parsing (dd/mm/yyyy)

## Project Structure

```
backend/
├── src/
│   ├── domain/                 # Domain layer (pure business logic)
│   │   ├── entities/           # Transaction, Account, Category, etc.
│   │   ├── value_objects/      # Money, DateRange, Scenario
│   │   ├── repositories/       # Port interfaces (ABC)
│   │   └── services/           # Domain services (pure logic)
│   ├── application/            # Application layer (orchestration)
│   │   ├── commands/           # ImportTransactionsCommand
│   │   ├── queries/            # GetProjectionQuery
│   │   ├── handlers/           # ImportTransactionsHandler
│   │   └── dto/                # Data transfer objects
│   └── infrastructure/         # Infrastructure layer (adapters)
│       ├── persistence/        # SQLAlchemy repositories
│       ├── import_adapters/    # CSV/OFX parsers
│       └── api/                # FastAPI routes & schemas
├── tests/
│   ├── unit/                   # Unit tests (mocked repos)
│   ├── integration/            # Integration tests (real DB)
│   ├── e2e/                    # End-to-end tests
│   └── factories/              # Test data factories
└── scripts/
    └── seed_data.py            # Initial data seeding
```

## Testing

### Run All Tests

```bash
# All tests with verbose output
pytest tests/ -v

# With coverage report
pytest tests/ --cov=src --cov-report=html

# Quick test (unit only)
pytest tests/unit/ -v
```

### Test Statistics

- **Total:** 200 tests
- **Unit Tests:** 166 tests (domain, application, factories)
- **Integration Tests:** 34 tests (database, CSV adapter)
- **Coverage:** 85%+ in domain and infrastructure layers

### Test Categories

1. **Domain Tests** (89 tests)
   - Entity creation and validation
   - Value object operations
   - Business logic rules

2. **Database Tests** (20 tests)
   - SQLAlchemy repository operations
   - Transaction handling
   - Query filtering and pagination

3. **Import Adapter Tests** (33 tests)
   - CSV parsing
   - French number format handling
   - Encoding detection
   - Debit/credit processing

4. **Domain Service Tests** (24 tests)
   - Categorization logic
   - Projection calculations
   - Scenario handling

5. **Application Tests** (13 tests)
   - Handler orchestration
   - DTO conversion
   - Import deduplication

6. **Factory Tests** (21 tests)
   - Test data generation
   - Realistic transaction batches
   - Category hierarchies

## Configuration

### Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=sqlite:///./data/finance.db

# API
API_PREFIX=/api/v1
DEBUG=False

# Security
SECRET_KEY=your-secret-key-here

# Claude AI (optional for advanced categorization)
CLAUDE_API_KEY=your-api-key-here
```

### Database

Default SQLite database: `./data/finance.db`

For development:
```bash
# Recreate database
rm data/finance.db
python scripts/seed_data.py
```

## Architecture Principles

### Hexagonal Architecture

```
        ┌─────────────────────────────────────┐
        │      External Interfaces            │
        │  (FastAPI routes, CLI, webhooks)    │
        └─────────────────────────────────────┘
                       ↓
        ┌─────────────────────────────────────┐
        │   Application Layer                 │
        │  (Commands, Queries, Handlers)      │
        └─────────────────────────────────────┘
                       ↓
        ┌─────────────────────────────────────┐
        │   Domain Layer (Core Business)      │
        │  (Entities, Services, Value Objects)│
        └─────────────────────────────────────┘
                       ↑
        ┌─────────────────────────────────────┐
        │    Infrastructure Layer             │
        │  (DB, CSV parsing, External APIs)   │
        └─────────────────────────────────────┘
```

### Key Principles

1. **Dependency Rule:** Inner layers never depend on outer layers
2. **Domain Independence:** Business logic has zero external dependencies
3. **Port-Adapter Pattern:** Repositories are ports (ABC), implementations are adapters
4. **CQRS:** Commands for writes (import), Queries for reads (projection)
5. **Value Objects:** Money, DateRange ensure type safety
6. **DTO Pattern:** Clean serialization boundary for API

## Development Workflow

### Adding a New Feature

1. **Write Domain Tests** (test-driven development)
   ```python
   # tests/unit/domain/test_new_feature.py
   def test_new_business_logic():
       entity = MyEntity(...)
       assert entity.some_method() == expected
   ```

2. **Implement Domain Logic**
   ```python
   # src/domain/entities/my_entity.py
   class MyEntity:
       def some_method(self):
           # Pure business logic
           return result
   ```

3. **Create Repository Port** (if needed)
   ```python
   # src/domain/repositories/my_repository.py
   class MyRepository(ABC):
       @abstractmethod
       def save(self, entity): ...
   ```

4. **Implement Repository** (adapter)
   ```python
   # src/infrastructure/persistence/sqlite_my_repository.py
   class SQLiteMyRepository(MyRepository):
       def save(self, entity): ...
   ```

5. **Create Handler** (application layer)
   ```python
   # src/application/handlers/my_handler.py
   class MyHandler:
       def handle(self, command):
           # Orchestrate domain + repo
           return result_dto
   ```

6. **Add API Route**
   ```python
   # src/infrastructure/api/routes/my_route.py
   @router.post("/endpoint")
   def endpoint(request): ...
   ```

### Common Commands

```bash
# Run specific test file
pytest tests/unit/domain/test_transaction.py -v

# Run tests matching pattern
pytest tests/ -k "import" -v

# Run with output capture
pytest tests/unit/test_factories.py -v -s

# Profile test execution
pytest tests/ --profile

# Run tests in parallel
pytest tests/ -n auto
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'src'"

**Solution:** Ensure you're running from the `backend` directory:
```bash
cd backend
pip install -e .  # Install in development mode
```

### Issue: Database locked error

**Solution:** Remove the SQLite database and reseed:
```bash
rm data/finance.db
python scripts/seed_data.py
```

### Issue: Tests failing after code changes

**Solution:** Clear pytest cache:
```bash
pytest --cache-clear
```

### Issue: Import fails with encoding error

**Solution:** Ensure CSV file is saved in UTF-8 or ISO-8859-1 encoding. The adapter auto-detects, but manually save with `encoding='utf-8'` if needed.

## Performance Tips

1. **Pagination:** Always use page/size parameters for large datasets
2. **Filtering:** Use date_from/date_to to limit result sets
3. **Batch Import:** Import large files at once rather than incremental
4. **Caching:** Projection results can be cached (invalidated on import)

## Next Steps (Future Phases)

- [ ] Phase 9: Budget management and anomaly detection
- [ ] Phase 10: Multi-user authentication and authorization
- [ ] Phase 11: Web dashboard (React/Vue frontend)
- [ ] Phase 12: Mobile app (React Native/Flutter)
- [ ] Phase 13: Advanced ML-based categorization
- [ ] Phase 14: Multi-currency and international accounts

## Support

For issues, questions, or feature requests:
1. Check the tests for usage examples
2. Review the docstrings in source code
3. Check `.env.example` for configuration
4. Run `python scripts/seed_data.py` to reset to defaults

## License

Proprietary - FinanceTracker Personal Finance Management Tool
