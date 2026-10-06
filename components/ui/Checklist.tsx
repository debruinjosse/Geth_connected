import type { ReactNode } from "react";
import { Check } from "lucide-react";

export function Checklist({ items }: { items: ReactNode[] }) {
  return (
    <ul className="lp-checklist">
      {items.map((item, index) => (
        <li key={index}>
          <Check aria-hidden="true" strokeWidth={2.4} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
