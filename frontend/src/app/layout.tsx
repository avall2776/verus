import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { MessageSquare, LayoutDashboard } from "lucide-react";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VERSUS - Motor Omnichannel",
  description: "Plataforma de IA e Atendimento",
  manifest: "/manifest.json",
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
    <html lang="pt-BR">
      <body className={`${inter.className} bg-background text-text-primary custom-scrollbar`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
