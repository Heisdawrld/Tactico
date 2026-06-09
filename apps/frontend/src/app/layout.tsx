import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import LiveFeedBar from "@/components/LiveFeedBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TACTICO — The Football Intelligence",
  description: "The world's first physics-based football manager with real-time 2D match simulation.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A1A1E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-display antialiased`}>
        <div className="flex h-screen overflow-hidden bg-charcoal">
          {/* Glassmorphism Icon Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col ml-[72px] h-screen">
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>

            {/* Bloomberg-style Live Feed Bar */}
            <LiveFeedBar />
          </div>
        </div>
      </body>
    </html>
  );
}
