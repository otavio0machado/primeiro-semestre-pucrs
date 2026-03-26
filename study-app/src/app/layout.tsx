import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cogni. — Sistema de Estudo",
  description: "Sistema cognitivo de estudo pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="flex h-screen overflow-hidden bg-bg-primary text-fg-primary">
        <Sidebar />
        <main className="ml-60 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
