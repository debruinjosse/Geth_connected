export function SignalList({
  items
}: {
  items: Array<{ id: string; tone: string; title: string; detail: string }>;
}) {
  return (
    <div className="signal-list">
      {items.map((signal) => (
        <div className="signal-card" key={signal.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="signal-icon" style={{ color: signal.tone }}>
              !
            </span>
            <div>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
            </div>
          </div>
          <strong>&rsaquo;</strong>
        </div>
      ))}
    </div>
  );
}
