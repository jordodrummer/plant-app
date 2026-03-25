import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { CartProvider } from "@/lib/cart-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rare Succulent Inventory",
  description: "Browse and shop rare cacti and succulents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <CartProvider>
          <Nav />
          <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
