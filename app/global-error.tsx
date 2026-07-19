"use client";

import Link from "next/link";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("GETH global error", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="app-error-shell">
          <section className="app-error-card">
            <p className="eyebrow">GETH</p>
            <h1>The app hit a temporary error.</h1>
            <p>
              This is usually fixed by trying again. If you are developing locally, restart the dev server after clearing
              the Next cache.
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
      </body>
    </html>
  );
}
