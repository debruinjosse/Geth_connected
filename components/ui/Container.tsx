export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`gt-container${className ? ` ${className}` : ""}`}>{children}</div>;
}
