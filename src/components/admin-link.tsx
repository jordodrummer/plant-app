"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = useMemo(() => createBrowserSupabase(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAdmin(session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <Link href="/admin" className="text-sm font-medium text-green-600 hover:text-green-500">
      Admin
    </Link>
  );
}
