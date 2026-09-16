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
  title: "TipOut",
  description: "Split Tips by Hours & Role",
  manifest: "/manifest.json",
  themeColor: "#14171C",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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