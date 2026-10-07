"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";

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
        <StatusScreen
          eyebrow="Temporary error"
          title="The app hit a temporary error."
          note={error.digest ? `Error reference: ${error.digest}` : undefined}
          actions={
            <>
              <Button type="button" onClick={reset}>
                Try again
              </Button>
              <Button variant="ghost" href="/">
                Go home
              </Button>
              <Button variant="ghost" href="mailto:info@geth.pro?subject=GETH%20website%20error" icon={<Mail />}>
                Email support
              </Button>
              <Button
                variant="ghost"
                href="https://wa.me/31613795467?text=Hi%20GETH%20Support%2C%20I%20need%20help%20with%20a%20website%20error."
                target="_blank"
                rel="noreferrer"
                icon={<MessageCircle />}
              >
                WhatsApp
              </Button>
            </>
          }
        >
          This is usually fixed by trying again. If it keeps happening, contact GETH® support and include the error
          reference below.
        </StatusScreen>
      </body>
    </html>
  );
}
