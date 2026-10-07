import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LenisProvider } from "@/components/providers/LenisProvider";

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
    "Mahadeva Digital Solutions (MDS), a Startup India–recognized technology company in Hyderabad, designs human-centered technologies that address real-world problems and create new markets. Creators of the Noorva Ecosystem and Noorva Companion — a personal humanized AI built on Emotional AI, Affective AI, and Human-Interactive AI — with a decade-long path into Quantum Technology, Nano technology, Automobiles, and Space tech. Think Beyond.",
  keywords: [
    "Mahadeva Digital Solutions",
    "MDS India",
    "Noorva AI",
    "Noorva Companion",
    "Noorva Ecosystem",
    "Personal Humanized AI",
    "Emotional AI",
    "Affective AI",
    "AI Companion",
    "Quantum Intelligence",
    "Startup India",
    "Hyderabad",
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
      "Human-centered technology for a better future. Meet Noorva — a personal humanized AI companion.",
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
        <LenisProvider>{children}</LenisProvider>
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
