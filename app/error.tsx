"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { StatusScreen } from "@/components/ui/StatusScreen";

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
    <StatusScreen
      eyebrow="Something went wrong"
      title="Something interrupted this page."
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
      The app is still running. Try reloading this view, or return to the homepage and open the page again. If it keeps
      happening, contact GETH® support with the error reference below.
    </StatusScreen>
  );
}
