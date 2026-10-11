import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import ReduxProvider from "@/components/ReduxProvider";
import { NavLinks } from "@/components/NavLinks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContentStore",
  description: "Manage your multi-platform content ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} font-sans h-full antialiased dark bg-background text-foreground w-full max-w-full overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col font-sans w-full max-w-full overflow-x-hidden">
        <ReduxProvider>
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full max-w-full">
          <div className="flex h-14 items-center px-4 md:px-6 max-w-6xl mx-auto w-full relative">
            <NavLinks />
          </div>
        </header>
        <main className="flex-1 w-full max-w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 box-border min-w-0">
            {children}
          </div>
        </main>
        <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
