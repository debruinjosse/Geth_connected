/** Inline GETH wordmark with registered mark — same typography as .brand-wordmark */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      GETH<sup className="brand-reg" aria-hidden="true">®</sup>
    </span>
  );
}
