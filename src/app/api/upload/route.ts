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
