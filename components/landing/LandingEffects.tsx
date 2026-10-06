"use client";

import { useEffect } from "react";

/** Staggered fade-up reveal for every `.lp-rv` element on the page. */
export function LandingEffects() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".lp-rv"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("lp-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-in");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${(index % 5) * 60}ms`;
      observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
