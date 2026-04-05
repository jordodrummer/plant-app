import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

// Singleton client for data queries (no auth context)
const supabase = createClient(supabaseUrl, supabaseKey);

export function getSupabase() {
  return supabase;
}

// Service role client for server-side DB operations (bypasses RLS)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

export function getServiceSupabase() {
  return serviceSupabase;
}

// Per-request client with cookie-based auth (for auth checks in server components and API routes)
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component (read-only cookies). Safe to ignore
          // if middleware is refreshing sessions.
        }
      },
    },
  });
}
