"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CardTile, type CardTileData } from "@/components/ui/CardTile";

export function CardCarousel({
  cards,
  labels
}: {
  cards: CardTileData[];
  labels: { previous: string; next: string };
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateActiveIndex() {
    const track = trackRef.current;
    if (!track) return;
    const tiles = Array.from(track.querySelectorAll<HTMLElement>(".gt-card-tile"));
    const next = tiles.reduce((closest, tile, index) => {
      const dist = Math.abs(tile.offsetLeft - track.scrollLeft);
      const closestDist = Math.abs((tiles[closest]?.offsetLeft ?? 0) - track.scrollLeft);
      return dist < closestDist ? index : closest;
    }, 0);
    setActiveIndex(next);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateActiveIndex();
    track.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => track.removeEventListener("scroll", updateActiveIndex);
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const tile = track?.querySelectorAll<HTMLElement>(".gt-card-tile")[index];
    if (!track || !tile) return;
    track.scrollTo({ left: tile.offsetLeft, behavior: "smooth" });
  }

  function goTo(direction: "previous" | "next") {
    const next = direction === "next" ? Math.min(activeIndex + 1, cards.length - 1) : Math.max(activeIndex - 1, 0);
    scrollToIndex(next);
  }

  return (
    <div className="gt-carousel" role="region" aria-roledescription="carousel" aria-label={labels.previous + " / " + labels.next}>
      <div
        className="gt-carousel-track"
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") goTo("next");
          if (event.key === "ArrowLeft") goTo("previous");
        }}
      >
        {cards.map((card) => (
          <div className="gt-carousel-item" key={card.index}>
            <CardTile card={card} />
          </div>
        ))}
      </div>

      <div className="gt-carousel-controls">
        <button
          aria-label={labels.previous}
          className="gt-carousel-arrow"
          disabled={activeIndex === 0}
          onClick={() => goTo("previous")}
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="gt-carousel-counter" aria-hidden="true">
          {String(activeIndex + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
        </span>
        <button
          aria-label={labels.next}
          className="gt-carousel-arrow"
          disabled={activeIndex === cards.length - 1}
          onClick={() => goTo("next")}
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
