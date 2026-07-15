"use client";

import Link from "next/link";
import { useEffect } from "react";

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
        <p className="eyebrow">GETH Connected Cards</p>
        <h1>Something interrupted this page.</h1>
        <p>
          The app is still running. Try reloading this view, or return to the homepage and open the page again.
        </p>
        {error.digest ? <small>Error reference: {error.digest}</small> : null}
        <div className="hero-actions">
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn btn-secondary" href="/">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
