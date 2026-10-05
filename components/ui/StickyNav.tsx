"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export function StickyNav({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <header className={`gt-navbar${scrolled ? " gt-navbar-scrolled" : ""}`}>{children}</header>;
}
