import { NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/lib/db/reservations";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleaned = await cleanupExpiredReservations();
    return NextResponse.json({ cleaned });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
