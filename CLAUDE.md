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

Next.js 16 App Router with TypeScript. Single project at repo root.

**Frontend:** Server components fetch data directly from PostgreSQL via Supabase. UI built with shadcn/ui + Tailwind CSS. Interactive elements use `"use client"` components.

**Data layer:** Supabase JS client (`src/lib/supabase/server.ts`). Query functions in `src/lib/db/*.ts` return typed results. Types defined in `src/lib/types.ts`.

**API routes:** `src/app/api/orders/route.ts` and `src/app/api/order-items/route.ts` handle mutations. Categories and plants are queried directly in server components.

**Database:** PostgreSQL on Supabase. Tables: `categories`, `plants`, `plant_variants`, `plant_images`, `customers`, `orders`, `order_details`. Connection via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.

## Writing Style

Never use em dashes in text, comments, commit messages, or documentation. En dashes are fine. Use commas, periods, or parentheses instead of em dashes.
