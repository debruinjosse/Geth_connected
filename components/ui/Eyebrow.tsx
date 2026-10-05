export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`gt-eyebrow${className ? ` ${className}` : ""}`}>{children}</span>;
}
