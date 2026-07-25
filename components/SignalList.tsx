import type { CSSProperties } from "react";

export function SignalList({
  items
}: {
  items: Array<{
    id: string;
    tone: string;
    title: string;
    detail: string;
    highlights?: Array<{ label: string; category: string; count: number; tone: string }>;
  }>;
}) {
  return (
    <div className="signal-list">
      {items.map((signal) => (
        <div className="signal-card" key={signal.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="signal-icon" style={{ color: signal.tone }}>
              AI
            </span>
            <div>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
              {signal.highlights?.length ? (
                <div className="signal-highlight-list" aria-label="Top recognition cards behind this signal">
                  {signal.highlights.map((highlight) => (
                    <span className="signal-highlight-pill" key={`${signal.id}-${highlight.label}`} style={{ "--signal-tone": highlight.tone } as CSSProperties}>
                      <b>{highlight.label}</b>
                      <small>{highlight.category} - {highlight.count} cards</small>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <strong>&rsaquo;</strong>
        </div>
      ))}
    </div>
  );
}
