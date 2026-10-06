"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

export type RailCard = { id: string; cat: string; name: string; category: string; src: string };

export function CardRail({
  header,
  cards,
  filters,
  ariaLabel,
  filterLabel,
  hint,
  prevLabel,
  nextLabel
}: {
  header: ReactNode;
  cards: RailCard[];
  filters: { key: string; label: string }[];
  ariaLabel: string;
  filterLabel: string;
  hint: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("all");

  function pick(key: string) {
    setActive(key);
    rail.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="lp-cards-top lp-rv">
        {header}
        <div className="lp-filters" role="group" aria-label={filterLabel}>
          {filters.map((filter) => (
            <button key={filter.key} type="button" aria-pressed={active === filter.key} onClick={() => pick(filter.key)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="lp-rail-wrap">
        <div className="lp-rail" ref={rail} tabIndex={0} aria-label={ariaLabel}>
          {cards.map((card) => (
            <figure key={card.id} className={`lp-rc${active !== "all" && card.cat !== active ? " lp-hide" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.src} alt={card.name} loading="lazy" />
              <figcaption>
                <b>{card.name}</b>
                <span>{card.category}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="lp-cards-foot">
        <span>{hint}</span>
        <div className="lp-arrows">
          <button type="button" aria-label={prevLabel} onClick={() => rail.current?.scrollBy({ left: -288, behavior: "smooth" })}>
            <svg viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" aria-label={nextLabel} onClick={() => rail.current?.scrollBy({ left: 288, behavior: "smooth" })}>
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
