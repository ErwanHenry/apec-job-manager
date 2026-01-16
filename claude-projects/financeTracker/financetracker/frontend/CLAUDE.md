# Frontend - FinanceTracker React Application

## 🎯 Overview

React 18 + TypeScript frontend for FinanceTracker personal finance management tool. Built with Vite for fast development and production builds.

## 🏗️ Architecture

### Tech Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation

### Project Structure
```
frontend/
├── src/
│   ├── api/                    # API client layer
│   │   ├── client.ts          # Axios instance
│   │   ├── accounts.ts        # Account endpoints
│   │   ├── transactions.ts    # Transaction endpoints
│   │   ├── import.ts          # Import endpoints
│   │   ├── projection.ts      # Projection endpoints
│   │   ├── categories.ts      # Category endpoints
│   │   └── types.ts           # TypeScript interfaces
│   │
│   ├── components/            # Reusable components
│   │   ├── Layout.tsx         # Main layout shell
│   │   ├── KPICard.tsx        # Metric display card
│   │   ├── TransactionCard.tsx # Transaction row
│   │   ├── FileUpload.tsx     # Drag & drop CSV
│   │   └── Pagination.tsx     # Pagination controls
│   │
│   ├── pages/                 # Route pages
│   │   ├── Dashboard.tsx      # Home page
│   │   ├── Accounts.tsx       # Account management
│   │   ├── Transactions.tsx   # Transaction list
│   │   ├── Import.tsx         # CSV import
│   │   └── Projection.tsx     # Balance projection
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAccounts.ts     # Account CRUD
│   │   ├── useTransactions.ts # Transaction fetching
│   │   ├── useProjection.ts   # Projection fetching
│   │   └── useImport.ts       # CSV import
│   │
│   ├── utils/
│   │   └── formatters.ts      # Format utilities
│   │
│   ├── App.tsx                # Root component + routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles + Tailwind
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
└── .env.example
```

## 🚀 Commands

### Development
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔌 API Integration

### Base URL Configuration
- Development: `http://localhost:8000/api/v1`
- Production: Set `VITE_API_URL` environment variable

### API Endpoints Used
```
GET    /api/v1/accounts              - List accounts
POST   /api/v1/accounts              - Create account
GET    /api/v1/transactions          - List transactions (with pagination & filters)
PUT    /api/v1/transactions/{id}/category - Assign category
POST   /api/v1/import                - Upload CSV
GET    /api/v1/projection            - Get balance projection
GET    /api/v1/categories            - List categories (hierarchical)
```

## 📊 Pages Overview

### Dashboard (`/`)
- KPI cards showing total balance, income, expenses, projection
- Recent transactions list
- Quick action links to main features

### Accounts (`/accounts`)
- List all accounts with balances
- Create new account form
- Account type and bank information display

### Transactions (`/transactions`)
- Paginated transaction list (50 items default)
- Filters: date range, account, search by description
- Transaction categorization status indicator
- Pagination controls with configurable page size

### Import (`/import`)
- Drag & drop CSV file upload
- Account selection
- Auto-categorization toggle
- Import result display with statistics
- Format help documentation

### Projection (`/projection`)
- Line chart showing 3 scenarios (pessimistic, realistic, optimistic)
- Period selector (3, 6, 12 months)
- Scenario details: starting balance, ending balance, min/max/average
- Chart with all three scenarios visible simultaneously

## 🎨 Tailwind Colors

Primary (Emerald): Financial growth theme
```css
primary-50 to primary-900
```

Accent (Amber): Warnings and highlights
```css
accent-50 to accent-900
```

Danger (Red): Critical alerts and negative values
```css
danger-50 to danger-900
```

## 🔄 Data Flow

```
Component
    ↓
Custom Hook (useAccounts, useTransactions, etc.)
    ↓
API Module (accounts.ts, transactions.ts, etc.)
    ↓
Axios Client
    ↓
FastAPI Backend
```

## 📝 Component Examples

### Using a Hook
```typescript
import { useTransactions } from '../hooks/useTransactions';

function MyComponent() {
  const { transactions, loading, pagination, setPage } = useTransactions();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {transactions.map(t => (
        <div key={t.id}>{t.description}: {t.amount}</div>
      ))}
    </div>
  );
}
```

### Using Formatters
```typescript
import { formatCurrency, formatDate, getAmountClass } from '../utils/formatters';

<p className={getAmountClass(amount)}>
  {formatCurrency(amount, 'EUR')}
</p>
```

## 🔐 Environment Variables

Create `.env.local` (not committed):
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=FinanceTracker
VITE_DEBUG=false
```

## 🧪 Testing

Currently no automated tests. Manual testing workflow:
1. Start backend: `cd ../backend && uvicorn src.main:app --reload`
2. Start frontend: `npm run dev`
3. Test each page manually
4. Verify responsive design on mobile/tablet/desktop

Future: Add Vitest + React Testing Library

## 📱 Responsive Design

Grid layout for all pages:
- Mobile: 1 column
- Tablet (md): 2-3 columns
- Desktop (lg): 3-4 columns

Uses Tailwind responsive prefixes: `md:`, `lg:`

## 🚢 Deployment

### Vercel
1. Connect GitHub repo
2. Configure environment variables:
   - `VITE_API_URL`: Backend API URL (e.g., `https://api.example.com/api/v1`)
3. Build command: `npm run build`
4. Output directory: `dist`
5. Framework: Vite

### Local Build
```bash
npm run build
npm run preview  # Test production build locally
```

## 🔧 Development Tips

### Hot Module Replacement (HMR)
- Vite automatically reloads on file changes
- React Fast Refresh preserves component state

### TypeScript
- Strict mode enabled
- Type-safe API integration
- Hover over variables for type info

### Debugging
- Chrome DevTools for React component inspection
- Network tab for API calls
- Console for error messages

## 📚 Related Documentation

- Backend: `../backend/CLAUDE.md`
- API Spec: Backend FastAPI `/docs` endpoint
- Main Project: `../CLAUDE.md`

## ⚠️ Known Limitations

1. **No authentication** - Add NextAuth or similar for user login
2. **No tests** - Add Vitest + React Testing Library
3. **No dark mode** - Can add with Tailwind class toggle
4. **No offline support** - Can add with service workers + IndexedDB
5. **No PWA manifest** - Can add for installable app

## 🎯 Future Enhancements

- [ ] Authentication system (JWT, OAuth)
- [ ] User preferences/settings page
- [ ] Export transactions (CSV, PDF)
- [ ] Budget alerts and notifications
- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Advanced charts and analytics
- [ ] Mobile app (React Native)
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Cypress/Playwright)

## 📞 Support

For issues or questions, check:
1. Backend API status: `GET http://localhost:8000/health`
2. Browser console for errors
3. Network tab for failed requests
4. Check `.env.local` for correct `VITE_API_URL`

---

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS
**Version:** 1.0.0
**Last Updated:** 2025-01-16
