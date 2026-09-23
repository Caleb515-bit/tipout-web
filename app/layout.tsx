import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14171C",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tipout.org'),
  title: {
    default: "TipOut — Split Tips by Hours & Role | Tip-Out Calculator for Hospitality",
    template: "%s | TipOut"
  },
  description: "TipOut splits pooled shift tips between servers, bartenders, and staff by hours worked and role weight — instantly, with exact-match totals. Built for tip-outs, not table splits.",
  keywords: [
    "tip out calculator",
    "tip pool splitter",
    "split tips by hours",
    "server tip split",
    "bartender tip out",
    "restaurant tip pooling",
    "shift tip calculator",
    "hospitality staff tool",
    "closing shift app"
  ],
  authors: [{ name: "Augustine Caleb", url: "https://tipout.org" }],
  creator: "Augustine Caleb",
  publisher: "TipOut",
  applicationName: "TipOut",
  category: "Finance",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TipOut",
  },

  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tipout.org",
    title: "TipOut — Split Tips by Hours & Role",
    description: "The staff-side tip-out tool: split pooled shift tips instantly by hours worked and role weight, with exact-match totals every time.",
    siteName: "TipOut",
    images: [
      {
        url: "/og-image.png", // TODO: replace with real 1200x630 social card — icon alone will crop badly
        width: 1200,
        height: 630,
        alt: "TipOut — Split Tips by Hours & Role",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TipOut — Split Tips by Hours & Role",
    description: "Split pooled shift tips by hours and role weight instantly. Built for servers & bartenders, not table splits.",
    images: ["/og-image.png"],
  },

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

  formatDetection: {
    telephone: false,
  },

  alternates: {
    canonical: "https://tipout.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TipOut',
    url: 'https://tipout.org',
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'FinanceApplication',
    description: 'TipOut splits pooled shift tips between hospitality staff by hours worked and role weight, with exact-match totals.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0.00',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'TipOut Pro (Monthly)',
        price: '4.99',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'TipOut Pro (Annual)',
        price: '39.00',
        priceCurrency: 'USD',
      },
    ],
  };

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
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