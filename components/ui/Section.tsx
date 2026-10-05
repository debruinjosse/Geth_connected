export function Section({
  children,
  background = "default",
  id,
  ariaLabelledby,
  className
}: {
  children: React.ReactNode;
  background?: "default" | "subtle" | "dark";
  id?: string;
  ariaLabelledby?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledby}
      className={`gt-section gt-section-${background}${className ? ` ${className}` : ""}`}
    >
      {children}
    </section>
  );
}
