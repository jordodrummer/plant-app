import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import { CartProvider } from "@/lib/cart-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cactus Shop",
  description: "Plant inventory management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Nav />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
