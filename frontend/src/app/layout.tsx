import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { MessageSquare, LayoutDashboard } from "lucide-react";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vallor - Motor Omnichannel",
  description: "Plataforma de IA e Atendimento",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/Favicon_vallor.svg?v=4", type: "image/svg+xml" },
      { url: "/favicon.ico?v=4", sizes: "any" },
    ],
    shortcut: "/Favicon_vallor.svg?v=4",
    apple: "/Favicon_vallor.svg?v=4",
  },
};

export const viewport: Viewport = {
  themeColor: "#050814",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Favicon_vallor.svg?v=4" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/Favicon_vallor.svg?v=4" />
      </head>
      <body className={`${inter.className} bg-background text-text-primary custom-scrollbar`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
