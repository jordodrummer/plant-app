# Plant Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to upload images for plants, stored in Vercel Blob, displayed on product list and detail pages.

**Architecture:** A client component handles file selection and uploads to a Next.js API route. The API route stores the file in Vercel Blob and updates the plant's `image` column in PostgreSQL. Product pages render images via `next/image` when available.

**Tech Stack:** `@vercel/blob`, Next.js API routes, `next/image`, existing `updateItem` db function

**Spec:** `docs/superpowers/specs/2026-03-22-image-upload-design.md`

**IMPORTANT:** Do not modify or delete any files in `plantInventory/` or `plantInventoryServer/`. These are kept for reference.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `next.config.ts` | Modify | Add Vercel Blob hostname to images.remotePatterns |
| `src/app/api/upload/route.ts` | Create | Upload API route: receive file, store in Blob, update DB |
| `src/components/image-upload.tsx` | Create | Client component: file picker + upload logic |
| `src/app/products/[productId]/page.tsx` | Modify | Show plant image, add ImageUpload component |
| `src/app/products/page.tsx` | Modify | Show plant images in product cards |

---

### Task 1: Install @vercel/blob and configure next/image

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Install @vercel/blob**

```bash
npm install @vercel/blob
```

- [ ] **Step 2: Update next.config.ts for remote images**

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts package.json package-lock.json
git commit -m "install @vercel/blob and configure next/image for remote images"
```

---

### Task 2: Upload API route

**Files:**
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: Create the upload route handler**

Create `src/app/api/upload/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateItem } from "@/lib/db/items";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plant_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!plantId) {
      return NextResponse.json({ error: "plant_id is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const id = Number(plantId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid plant_id" }, { status: 400 });
    }

    const blob = await put(`plants/${id}/${file.name}`, file, {
      access: "public",
    });

    await updateItem(id, { image: blob.url });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts
git commit -m "add image upload API route with Vercel Blob storage"
```

---

### Task 3: Image upload client component

**Files:**
- Create: `src/components/image-upload.tsx`

- [ ] **Step 1: Create the ImageUpload component**

Create `src/components/image-upload.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  plantId: number;
};

export default function ImageUpload({ plantId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("plant_id", String(plantId));

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id={`upload-${plantId}`}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/image-upload.tsx
git commit -m "add image upload client component"
```

---

### Task 4: Show image and upload on product detail page

**Files:**
- Modify: `src/app/products/[productId]/page.tsx`

- [ ] **Step 1: Update the product detail page**

Read `src/app/products/[productId]/page.tsx` first. Then make these changes:

1. Add imports at the top:
```tsx
import Image from "next/image";
import ImageUpload from "@/components/image-upload";
```

2. Inside the `<Card>`, add the image between `<CardHeader>` and `<CardContent>`. The full return should become:

```tsx
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">{plant.cultivar_name}</CardTitle>
      </CardHeader>
      {plant.image && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={plant.image}
            alt={plant.cultivar_name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="space-y-4">
        {category && (
          <p className="text-sm text-muted-foreground">
            Category: {category.name}
          </p>
        )}
        <p>{plant.details}</p>
        <div className="flex gap-4">
          <span className="font-semibold text-lg">${plant.price}</span>
          <span className={plant.in_stock ? "text-green-600" : "text-red-500"}>
            {plant.in_stock ? `In stock (${plant.inventory})` : "Out of stock"}
          </span>
        </div>
        <AddToCartButton
          plant_id={plant.id}
          cultivar_name={plant.cultivar_name}
          price={plant.price}
          in_stock={plant.in_stock}
        />
        <ImageUpload plantId={plant.id} />
      </CardContent>
    </Card>
  );
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/products/[productId]/page.tsx"
git commit -m "show plant image and upload button on product detail page"
```

---

### Task 5: Show images on product list page

**Files:**
- Modify: `src/app/products/page.tsx`

- [ ] **Step 1: Update the product list page**

Read `src/app/products/page.tsx` first. Then:

1. Add import at the top:
```tsx
import Image from "next/image";
```

2. Add the image inside each Card, between `<CardHeader>` and `<CardContent>`:

```tsx
          <Card key={plant.id}>
            <CardHeader>
              <CardTitle>{plant.cultivar_name}</CardTitle>
            </CardHeader>
            {plant.image && (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={plant.image}
                  alt={plant.cultivar_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent>
```

The rest of CardContent stays the same.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/products/page.tsx
git commit -m "show plant images on product list cards"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Manual testing**

```bash
npm run dev
```

Test (requires `BLOB_READ_WRITE_TOKEN` in `.env.local` for upload to work):
- Visit `/products/1` — "Upload Image" button visible below Add to Cart
- Click "Upload Image" — file picker opens, select an image
- After upload, page refreshes and image appears in the card
- Visit `/products` — product card shows the uploaded image
- Try uploading a non-image file — should show error
- Try uploading when no `BLOB_READ_WRITE_TOKEN` is set — should show error gracefully

- [ ] **Step 4: Final commit if cleanup needed**

Only commit if there are actual changes:

```bash
git add src/
git commit -m "image upload cleanup"
```
