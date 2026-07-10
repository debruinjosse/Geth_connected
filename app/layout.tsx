import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Oswald } from "next/font/google";
import "./globals.css";

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const editorial = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: ["500", "600", "700"]
});

export const metadata: Metadata = {
  title: "GETH Connected Cards",
  description: "Physical recognition. Digital culture insight."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${body.variable} ${editorial.variable}`}>{children}</body>
    </html>
  );
}
