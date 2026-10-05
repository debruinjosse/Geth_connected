import type { ReactNode } from "react";

export function MockupFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`gt-mockup-frame${className ? ` ${className}` : ""}`}>{children}</div>;
}
