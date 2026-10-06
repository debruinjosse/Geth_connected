import type { ReactNode } from "react";

export type MeterItem = { label: ReactNode; value: number; valueLabel?: ReactNode; color?: string; helper?: ReactNode };

/** Labelled horizontal progress rows (categories, qualities). Widths are relative to the largest value unless `max` is set. */
export function MeterList({ items, max }: { items: MeterItem[]; max?: number }) {
  const top = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="lp-meters">
      {items.map((item, index) => {
        const width = item.value > 0 ? Math.max(4, Math.round((item.value / top) * 100)) : 0;
        return (
          <div className="lp-meter" key={index}>
            <div className="lp-meter-top">
              <span>{item.label}</span>
              <b>{item.valueLabel ?? item.value}</b>
            </div>
            <div className="lp-meter-track" role="presentation">
              <span className="lp-meter-fill" style={{ width: `${width}%`, background: item.color ?? "var(--purple)" }} />
            </div>
            {item.helper ? <small className="lp-hint">{item.helper}</small> : null}
          </div>
        );
      })}
    </div>
  );
}
