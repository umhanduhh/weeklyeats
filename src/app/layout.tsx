import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeeklyEats",
  description: "Plan your weekly meals",
  manifest: "/manifest.json",
  applicationName: "WeeklyEats",
  appleWebApp: {
    capable: true,
    title: "WeeklyEats",
    // 'default' keeps the iOS status bar normal (dark text on light bg).
    // We pair this with body bg = #F8FAFB so the notch area blends in.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Stop iOS from auto-linking ingredient amounts as phone numbers, etc.
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewportFit:'cover' lets the page draw under the notch + home indicator;
  // we use env(safe-area-inset-*) in CSS to keep tap targets out of those zones.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00A6A6" },
    { media: "(prefers-color-scheme: dark)", color: "#00A6A6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
