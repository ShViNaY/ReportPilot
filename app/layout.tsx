import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/context/AuthContext";
import { getBaseUrl } from "@/lib/utils/url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "ReportPilot | Marketing Reporting for Agencies",
    template: "%s | ReportPilot",
  },
  description:
    "Live campaign reporting and client portals for marketing agencies. Consolidate Google Ads, Meta Ads, spend, leads, and conversion analytics in real time without the slide deck.",
  keywords: [
    "marketing agency reporting software",
    "agency client reporting dashboard",
    "client portal marketing agency",
    "automated marketing reports",
    "multi-client ad reporting",
    "marketing analytics dashboard",
  ],
  authors: [{ name: "ReportPilot" }],
  creator: "ReportPilot",
  publisher: "ReportPilot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ReportPilot",
    title: "ReportPilot | Marketing Reporting for Agencies",
    description:
      "One dashboard. Every client's numbers, live. Eliminate manual weekly reporting decks with real-time agency dashboards and client portals.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReportPilot | Marketing Reporting for Agencies",
    description:
      "One dashboard. Every client's numbers, live. Real-time agency campaign reporting and client portals.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`} style={{ colorScheme: 'dark' }}>
      <body className="font-sans antialiased text-zinc-100 bg-zinc-950 selection:bg-lime-400 selection:text-black">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

