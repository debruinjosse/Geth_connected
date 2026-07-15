import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GETH Connected Cards",
  description: "Physical recognition. Digital culture insight."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
