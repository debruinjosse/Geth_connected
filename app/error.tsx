"use client";

import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { BrandWordmark } from "@/components/BrandWordmark";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("GETH route error", error);
    }
  }, [error]);

  return (
    <main className="app-error-shell">
      <section className="app-error-card">
        <p className="eyebrow"><BrandWordmark /></p>
        <h1>Something interrupted this page.</h1>
        <p>
          The app is still running. Try reloading this view, or return to the homepage and open the page again. If it
          keeps happening, contact GETH® support with the error reference below.
        </p>
        {error.digest ? <small>Error reference: {error.digest}</small> : null}
        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-secondary" href="/">
            Go home
          </Link>
          <a className="btn btn-secondary" href="mailto:info@geth.pro?subject=GETH%20website%20error">
            <Mail size={16} /> Email support
          </a>
          <a className="btn btn-whatsapp" href="https://wa.me/31613795467?text=Hi%20GETH%20Support%2C%20I%20need%20help%20with%20a%20website%20error." target="_blank" rel="noreferrer">
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
