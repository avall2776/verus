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
  manifest: "/vallor/manifest.json",
  icons: {
    icon: [
      { url: "/vallor/Favicon_vallor.svg?v=4", type: "image/svg+xml" },
      { url: "/vallor/favicon.ico?v=4", sizes: "any" },
    ],
    shortcut: "/vallor/Favicon_vallor.svg?v=4",
    apple: "/vallor/Favicon_vallor.svg?v=4",
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
        <link rel="icon" href="/vallor/Favicon_vallor.svg?v=4" type="image/svg+xml" />
        <link rel="alternate icon" href="/vallor/favicon.ico?v=4" />
        <link rel="apple-touch-icon" href="/vallor/Favicon_vallor.svg?v=4" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=window.location.pathname;if(p==="/login"||p.indexOf("/login")===0){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light","theme-whatsapp");document.documentElement.setAttribute("data-theme","dark");return;}var t=localStorage.getItem("versus_theme")||localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark","theme-whatsapp");document.documentElement.classList.add("light");document.documentElement.setAttribute("data-theme","light");}else if(t==="whatsapp"){document.documentElement.classList.add("dark","theme-whatsapp");document.documentElement.classList.remove("light");document.documentElement.setAttribute("data-theme","whatsapp");}else{document.documentElement.classList.add("dark");document.documentElement.classList.remove("light","theme-whatsapp");document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${inter.className} bg-background text-text-primary custom-scrollbar`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
