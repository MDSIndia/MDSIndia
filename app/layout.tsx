import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { PortalTransitionProvider } from "@/components/PortalTransition/PortalTransitionProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    <html
      lang="en"
      className={outfit.variable}
      style={{ backgroundColor: "#020208" }}
    >
      <body
        className="noise"
        style={{ backgroundColor: "#020208", color: "#ffffff" }}
      >
        <PortalTransitionProvider>
          <LenisProvider>{children}</LenisProvider>
        </PortalTransitionProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DN53L6G5J7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DN53L6G5J7');
          `}
        </Script>
      </body>
    </html>
  );
}
