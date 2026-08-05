import { Poppins } from "next/font/google";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-context";
import { CartProvider } from "@/components/cart-context";
import { CatalogProvider } from "@/components/catalog-context";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Big Bro Shawarma — Fresh Shawarma Delivered Fast",
  description:
    "Order premium flame-grilled shawarma from Big Bro Shawarma in Accra. Fast delivery, loyalty rewards, and mouthwatering combos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>{children}</CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
