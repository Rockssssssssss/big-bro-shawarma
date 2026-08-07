import { Inter, Poppins } from "next/font/google";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-context";
import { CartProvider } from "@/components/cart-context";
import { CartToastProvider } from "@/components/cart-toast-provider";
import { CatalogProvider } from "@/components/catalog-context";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Big Bro Shawarma — Fresh Shawarma Delivered Fast",
  description:
    "Order premium flame-grilled shawarma from Big Bro Shawarma in Techiman. Fast delivery, loyalty rewards, and mouthwatering combos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <CartToastProvider>{children}</CartToastProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
