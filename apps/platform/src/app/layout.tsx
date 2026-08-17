import type { Metadata } from "next";
import "@fontsource/poppins/400.css";
import localFont from "next/font/local";
import "./globals.css";

const brittany = localFont({
  src: "./fonts/BrittanySignature.ttf",
  display: "swap",
  variable: "--font-brittany",
});

export const metadata: Metadata = {
  title: "Super Campus | Student Portal",
  description: "Super Campus student dashboard",
};

// Authentication and runtime API configuration must never be served from a stale
// prerendered document, because the document also carries the active CSP policy.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={brittany.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
