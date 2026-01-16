# FinanceTracker Frontend

React + TypeScript frontend for FinanceTracker personal finance management tool.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Setup

Create `.env.local`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Development

```bash
# Development server with HMR
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

## Project Structure

- **`src/api/`** - API client modules (accounts, transactions, import, projection)
- **`src/components/`** - Reusable React components (Layout, KPICard, etc.)
- **`src/pages/`** - Route pages (Dashboard, Accounts, Transactions, etc.)
- **`src/hooks/`** - Custom React hooks for data fetching
- **`src/utils/`** - Utility functions (formatters, validators)

## Features

- 📊 **Dashboard** - Overview with KPI cards and recent transactions
- 🏦 **Accounts** - Manage bank accounts and view balances
- 💳 **Transactions** - View and filter transactions with pagination
- 📤 **Import** - Upload CSV files (LCL format) with auto-categorization
- 📈 **Projection** - Visualize balance projections with 3 scenarios

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Charts
- **Tailwind CSS** - Styling
- **date-fns** - Date utilities

## Building

```bash
npm run build
# Output: dist/
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import project on Vercel
3. Set environment variable: `VITE_API_URL`
4. Deploy!

```bash
# Local test
npm run preview
```

## Backend API

Ensure backend is running:
```bash
cd ../backend
python -m uvicorn src.main:app --reload
```

API available at: `http://localhost:8000/api/v1`

API docs: `http://localhost:8000/docs`

## Contributing

1. Follow TypeScript strict mode
2. Use Tailwind CSS for styling
3. Keep components under 200 lines
4. Use custom hooks for data fetching
5. Add prop validation with TypeScript

## License

MIT

---

**Documentation:** See `CLAUDE.md` for detailed development guide
