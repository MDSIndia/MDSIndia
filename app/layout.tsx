import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/fevicon.png",
    shortcut: "/fevicon.png",
    apple: "/fevicon.png",
  },
  title: "Mahadeva Digital Solutions | Think Beyond | AI Companion Noorva",
  description:
    "Mahadeva Digital Solutions (MDS) is building the future of AI. Creators of Noorva — the world's most intelligent AI companion designed to understand, learn, and guide you through life. Think Beyond.",
  keywords: [
    "Mahadeva Digital Solutions",
    "MDS India",
    "Noorva AI",
    "AI Companion",
    "Artificial Intelligence",
    "Future Technology",
    "Think Beyond",
  ],
  authors: [{ name: "Mahadeva Digital Solutions" }],
  creator: "Mahadeva Digital Solutions",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mdsindia.ai",
    title: "Mahadeva Digital Solutions | Think Beyond",
    description:
      "We don't just build software. We build the future. Meet Noorva — your AI companion.",
    siteName: "Mahadeva Digital Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahadeva Digital Solutions | Think Beyond",
    description: "We don't just build software. We build the future.",
    creator: "@mdsindia",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} noise`}>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
