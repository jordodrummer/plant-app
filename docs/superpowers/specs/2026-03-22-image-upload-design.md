# Plant Image Upload Design

## Overview

Allow users to upload images for plants. Files stored in Vercel Blob, URL saved to the plant's `image` column in PostgreSQL. Images displayed on product list cards and detail pages. Currently open to anyone; will be gated behind auth when that feature is built.

## Storage

**Vercel Blob** via `@vercel/blob` package. Returns a public URL for each uploaded file. Requires `BLOB_READ_WRITE_TOKEN` env var (generated from Vercel dashboard, added to `.env.local`).

## Upload Flow

1. User visits `/products/[id]` detail page
2. Clicks "Upload Image" button (client component)
3. File picker opens (accepts `image/*` only)
4. On file select, client POSTs the file to `/api/upload` with the `plant_id`
5. API route validates the file is an image, stores it in Vercel Blob
6. API route updates the plant's `image` column with the returned URL
7. Client refreshes the page via `router.refresh()` to show the new image

## API Route

`src/app/api/upload/route.ts`:
- POST handler
- Accepts `multipart/form-data` with `file` (image) and `plant_id` (number)
- Validates: file exists, file is an image type, plant_id is valid
- Calls `put()` from `@vercel/blob` to store the file
- Calls `updateItem(plant_id, { image: blob.url })` to save URL to database
- Returns `{ url: string }` on success, appropriate error status on failure

## Image Display

**Product list** (`src/app/products/page.tsx`):
- Show plant image in card when `image` is non-empty
- Use `next/image` for optimization
- Fallback: show plant name text only (current behavior) when no image

**Product detail** (`src/app/products/[productId]/page.tsx`):
- Show large plant image at top of card when available
- `ImageUpload` component below the image (or in place of image when none exists)

## New Files

- `src/app/api/upload/route.ts` — upload API route handler
- `src/components/image-upload.tsx` — `"use client"` file picker + upload component

## Modified Files

- `src/app/products/page.tsx` — render plant images in cards
- `src/app/products/[productId]/page.tsx` — render plant image, add ImageUpload component
- `next.config.ts` — add Vercel Blob hostname to `images.remotePatterns` for `next/image`

## New Dependency

- `@vercel/blob`

## Environment

Add to `.env.local`:
```
BLOB_READ_WRITE_TOKEN=<token from Vercel dashboard>
```

## Future

Upload will be gated behind authentication when the auth feature is built. No auth check in the upload API route for now.
