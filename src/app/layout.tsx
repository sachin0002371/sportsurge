import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteDisclaimer from "@/components/SiteDisclaimer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage",
  description: "Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides. Comprehensive coverage of NBA, NFL, MLB, NHL, F1, MMA, Cricket, Boxing, and College Sports.",
  keywords: ["Sportsurge", "Sportsurge Official", "live scores", "sports fixtures", "sports coverage", "match tracker", "NBA", "NFL", "MLB", "NHL", "F1", "MMA", "Cricket", "Boxing", "NCAAF", "NCAAB", "streaming guides"],
  authors: [{ name: "Sportsurge Official" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage",
    description: "Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides.",
    url: "https://sportsurge.com",
    siteName: "Sportsurge Official",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sportsurge Official – Fast Live Scores, Fixtures & Sports Coverage",
    description: "Get real-time live sports scores, official fixtures, instant match trackers, expert analysis, and legal broadcast guides.",
  },
  other: {
    'robots': 'max-image-preview:large',
    'google-adsense-account': 'ca-pub-9074769053982810',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google AdSense - using plain script tag to avoid data-nscript attribute issue */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9074769053982810"
          crossOrigin="anonymous"
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KKD0ZD105B"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-KKD0ZD105B');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased font-sans`} style={{ backgroundColor: '#EDF1F6', color: '#222226' }}>
        <div className="min-h-screen flex flex-col">
          <SiteDisclaimer />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
