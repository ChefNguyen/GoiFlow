import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "GoiFlow — Master Japanese Vocabulary & Speed Battle",
    template: "%s | GoiFlow",
  },
  description:
    "Master Japanese Kanji & Vocabulary with fast-paced quiz flows, stroke order animations, and multiplayer battles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-[var(--color-page)] text-[var(--color-ink)]"
      >
        {children}
      </body>
    </html>
  );
}
