"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export interface RecognitionCardData {
  number: string;
  category: string;
  title: string;
  description: string;
}

interface RecognitionCardCarouselProps {
  cards: RecognitionCardData[];
  labels: {
    previous: string;
    next: string;
  };
}

function RecognitionCard({ card }: { card: RecognitionCardData }) {
  return (
    <article className="recognitionCard">
      <div className="recognitionCardTop">
        <span className="recognitionCardLogo">
          <Image alt="GETH crest" src="/assets/geth-logo.svg" width={30} height={30} />
          <span>GETH</span>
        </span>
        <span className="recognitionCardNumber">CARD {card.number}</span>
      </div>
      <div className="recognitionCardBody">
        <span className="recognitionCardCategory">{card.category}</span>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>
    </article>
  );
}

export function RecognitionCardCarousel({ cards, labels }: RecognitionCardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  function updateState() {
    const track = trackRef.current;
    if (!track) return;

    const cardsInTrack = Array.from(track.querySelectorAll<HTMLElement>(".recognitionCard"));
    const nextIndex = cardsInTrack.reduce((closestIndex, card, index) => {
      const currentDistance = Math.abs(card.offsetLeft - track.scrollLeft);
      const closestDistance = Math.abs(cardsInTrack[closestIndex]?.offsetLeft - track.scrollLeft);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    setActiveIndex(nextIndex);
    setCanScroll(track.scrollWidth > track.clientWidth + 4);
  }

  useEffect(() => {
    updateState();

    const track = trackRef.current;
    if (!track) return;

    const resizeObserver = new ResizeObserver(updateState);
    resizeObserver.observe(track);
    track.addEventListener("scroll", updateState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      track.removeEventListener("scroll", updateState);
    };
  }, []);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const card = track?.querySelectorAll<HTMLElement>(".recognitionCard")[index];
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  }

  function scrollByCard(direction: "previous" | "next") {
    const nextIndex = direction === "next" ? Math.min(activeIndex + 1, cards.length - 1) : Math.max(activeIndex - 1, 0);
    scrollToIndex(nextIndex);
  }

  return (
    <div className="cardCarousel">
      <button
        aria-label={labels.previous}
        className="cardCarouselButton cardCarouselButtonPrevious"
        disabled={!canScroll || activeIndex === 0}
        onClick={() => scrollByCard("previous")}
        type="button"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="cardCarouselTrack" ref={trackRef}>
        {cards.map((card) => (
          <RecognitionCard card={card} key={`${card.number}-${card.title}`} />
        ))}
      </div>
      <button
        aria-label={labels.next}
        className="cardCarouselButton cardCarouselButtonNext"
        disabled={!canScroll || activeIndex >= cards.length - 1}
        onClick={() => scrollByCard("next")}
        type="button"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
