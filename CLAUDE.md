# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # Start Next.js dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run seed      # Seed the PostgreSQL database
```

## Architecture

Next.js 15 App Router with TypeScript. Single project at repo root.

**Frontend:** Server components fetch data directly from PostgreSQL — no client-side fetch pattern. UI built with shadcn/ui + Tailwind CSS. Interactive elements use `"use client"` components.

**Data layer:** Raw SQL via `pg` Pool (`src/lib/db/client.ts`). Query functions in `src/lib/db/*.ts` return typed results. Types defined in `src/lib/types.ts`.

**API routes:** `src/app/api/orders/route.ts` and `src/app/api/order-items/route.ts` handle mutations. Categories and plants are queried directly in server components.

**Database:** PostgreSQL database `cactus_shop`. Tables: `categories`, `plants`, `customers`, `orders`, `order_details`. Connection via `DATABASE_URL` env var with fallback to individual `DB_*` vars.

## Legacy Reference

`plantInventory/` (old React+Vite frontend) and `plantInventoryServer/` (old Express backend) are kept for reference. Do not modify or delete them.
