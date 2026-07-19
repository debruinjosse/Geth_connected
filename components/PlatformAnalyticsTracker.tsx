"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function sendAnalyticsEvent(payload: {
  eventType: "page_view" | "time_spent";
  path: string;
  locale: string;
  durationSeconds?: number;
}) {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
    return;
  }

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true
  }).catch(() => {
    // Analytics should never interrupt the product experience.
  });
}

export function PlatformAnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathRef = useRef("");
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const search = searchParams.toString();
    const path = `${pathname}${search ? `?${search}` : ""}`;
    const previousPath = currentPathRef.current;

    if (previousPath) {
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      sendAnalyticsEvent({ eventType: "time_spent", path: previousPath, locale, durationSeconds });
    }

    currentPathRef.current = path;
    startedAtRef.current = Date.now();
    sendAnalyticsEvent({ eventType: "page_view", path, locale });
  }, [locale, pathname, searchParams]);

  useEffect(() => {
    function flushTimeSpent() {
      if (!currentPathRef.current) return;
      const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      sendAnalyticsEvent({ eventType: "time_spent", path: currentPathRef.current, locale, durationSeconds });
    }

    window.addEventListener("pagehide", flushTimeSpent);
    return () => {
      flushTimeSpent();
      window.removeEventListener("pagehide", flushTimeSpent);
    };
  }, [locale]);

  return null;
}
