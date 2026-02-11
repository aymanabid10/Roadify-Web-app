import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";
import { ChatWrapper } from "@/components/chat/ChatWrapper";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roadify - Buy, Sell & Rent Vehicles",
  description: "The smart way to buy, sell, and rent vehicles online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar className="hidden md:flex" />
              <main className="flex-1 overflow-auto">
                {children}
                <ChatWrapper/>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
