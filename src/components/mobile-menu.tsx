"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthButton from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminLink from "@/components/admin-link";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(!open)}>
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-full border-b bg-background px-4 py-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/products"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              Products
            </Link>
            <AdminLink />
            <div className="flex items-center gap-4 border-t pt-4">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
