import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GETH",
  description: "Physical recognition. Digital culture insight.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png"
  },
  other: {
    google: "notranslate"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" translate="no" className="notranslate" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
