import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  return NextResponse.json({
    user_email: user?.email ?? null,
    admin_email: process.env.ADMIN_EMAIL ?? null,
    match: user?.email === process.env.ADMIN_EMAIL,
  });
}
