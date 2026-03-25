import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createImage } from "@/lib/db/images";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ImageType } from "@/lib/types";

const VALID_IMAGE_TYPES: ImageType[] = ["plant", "mother", "father", "cutting", "grown_example"];

export async function POST(request: Request) {
  try {
    // Admin only
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plant_id") as string | null;
    const imageType = (formData.get("image_type") as string) || "plant";
    const caption = (formData.get("caption") as string) || null;

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

    if (!VALID_IMAGE_TYPES.includes(imageType as ImageType)) {
      return NextResponse.json({ error: "Invalid image_type" }, { status: 400 });
    }

    const blob = await put(`plants/${id}/${file.name}`, file, {
      access: "public",
    });

    const image = await createImage({
      plant_id: id,
      url: blob.url,
      image_type: imageType as ImageType,
      caption,
      sort_order: 0,
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
