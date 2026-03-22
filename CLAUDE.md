# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Two independent projects sharing a git root (no workspace orchestration):

- **`plantInventory/`** — React frontend (Vite + MUI)
- **`plantInventoryServer/`** — Express backend (PostgreSQL via raw `pg` queries)

## Development Commands

### Frontend (`plantInventory/`)
```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint (zero warnings enforced)
npm run preview   # Preview production build
```

### Backend (`plantInventoryServer/`)
```bash
npm run dev       # Start with nodemon (auto-reload)
npm run seed:dev  # Seed the PostgreSQL database
```

Both projects require separate `npm install`. There is no root package.json.

## Architecture

**Frontend:** React 18 with React Router v6 for routing and MUI 5 for components. State is managed with React hooks (useState/useEffect). Currently fetches from fakestoreapi.com as a mock data source — not yet connected to the backend.

**Backend:** Express server with CORS and Morgan logging. PostgreSQL database named `cactus_shop` connected via `client.js`. Database functions use raw SQL (no ORM). Schema has tables: `categories`, `plants`, `customers`, `orders`, `order_details`.

**Routes** are mounted under `/api/orders` and `/api/orderItems`. Most DB functions and route handlers are stubs awaiting implementation.

## Database

Connection configured in `plantInventoryServer/client.js` with env vars: `DB_URL`, `DB_NAME` (default: `cactus_shop`), `DB_HOST`, `DB_USER`, `DB_PORT`. Uses dotenv for local config.
