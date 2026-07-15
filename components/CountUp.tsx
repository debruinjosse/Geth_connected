"use client";

import { useEffect, useState } from "react";

export function CountUp({
  value,
  suffix = "",
  duration = 1200,
  delay = 0
}: {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;
    const timeout = window.setTimeout(() => {
      const tick = (time: number) => {
        startTime ??= time;
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * eased));

        if (progress < 1) {
          frame = window.requestAnimationFrame(tick);
        }
      };

      frame = window.requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
    };
  }, [delay, duration, value]);

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
}
