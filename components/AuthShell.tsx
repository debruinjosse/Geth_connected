import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { GoldenLeaves } from "@/components/GoldenLeaves";

export function AuthShell({
  title,
  subtitle,
  eyebrow,
  children
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <BrandLogo tagline />
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="auth-bullets">
          <span>Physical recognition, digital insight</span>
          <span>Private, thoughtful, measurable</span>
          <span>Designed for modern teams</span>
        </div>
        <GoldenLeaves className="auth-leaves" />
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  );
}
