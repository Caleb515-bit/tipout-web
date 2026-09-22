import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from './SessionProviderWrapper';

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tipout.org'), 
  title: {
    default: "TipOut — Fast & Accurate Tip Splitting for Hospitality Workers",
    template: "%s | TipOut"
  },
  description: "The ultimate tip-splitting web application for servers, bartenders, and hospitality staff. Split shift tips instantly by hours and role weights with exact match totals.",
  keywords: ["tip splitter", "hospitality tool", "server tip calculator", "bartender tip share", "shift closing app", "PWA tip calculator"],
  authors: [{ name: "Augustine Caleb" }],
  creator: "Augustine Caleb",
  publisher: "TipOut",
  manifest: "/manifest.json",
  themeColor: "#14171C",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  
  // 🌐 OpenGraph / Social Scrapers (WhatsApp, Discord, LinkedIn, Facebook)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tipout.org",
    title: "TipOut — Smart Tip Splitting for Hospitality Workers",
    description: "Calculate and split shift tips fairly by hours and custom role weights. Save closing tickets and generate instant receipt images.",
    siteName: "TipOut",
    images: [
      {
        url: "/icons/icon-512.png", // Uses your PWA high-res icon as the social preview thumbnail
        width: 512,
        height: 512,
        alt: "TipOut App Logo",
      },
    ],
  },

  // 🐦 Twitter Card Metadata
  twitter: {
    card: "summary_large_image",
    title: "TipOut — Fast & Accurate Tip Splitting",
    description: "Split shift tips by hours and custom role weights instantly. Built for hospitality pros.",
    images: ["/icons/icon-512.png"],
  },

  // 🤖 Search Engine Crawler Directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🔍 Structured JSON-LD Schema for Search Engine Bots (Google / Bing)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TipOut',
    operatingSystem: 'All',
    applicationCategory: 'BusinessApplication',
    description: 'Fast and accurate tip-splitting web application for hospitality workers and servers.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* Inject JSON-LD Structured Data for Bot Recognition */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-text-primary font-sans antialiased selection:bg-accent selection:text-background min-h-screen flex justify-center">
        <SessionProviderWrapper>
          <div className="w-full max-w-md bg-background min-h-screen shadow-2xl flex flex-col relative border-x border-border">
            {children}
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}