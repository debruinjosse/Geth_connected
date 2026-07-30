import type { Metadata } from "next";
import "./fonts/stolzl.css";
import "./globals.css";
import "./globals-mobile-polish.css";
import "./globals-dashboard-enterprise.css";
import "./globals-hero-enterprise.css";

export const metadata: Metadata = {
  title: "GETH",
  description: "Physical recognition. Digital culture insight.",
  // Tab and home-screen icons come from app/icon.png and app/apple-icon.png.
  other: {
    google: "notranslate"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" translate="no" className="notranslate">
      <body>{children}</body>
    </html>
  );
}
