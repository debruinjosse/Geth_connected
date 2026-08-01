import { Reveal } from "@/components/Reveal";
import type { TestimonialItem } from "@/lib/home-cms-defaults";

type LandingTestimonialsSectionProps = {
  eyebrow: string;
  title: string;
  copy: string;
  items: TestimonialItem[];
};

export function LandingTestimonialsSection({ eyebrow, title, copy, items }: LandingTestimonialsSectionProps) {
  if (!items.length) return null;

  return (
    <section className="section-shell landing-testimonials" id="testimonials">
      <div className="pageContainer">
        <Reveal className="landing-testimonials-copy" distance={18}>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="section-title">{title}</h2>
          <p className="hero-detail-copy">{copy}</p>
        </Reveal>
        <div className="landing-testimonials-grid">
          {items.map((item, index) => (
            <Reveal className="landing-testimonial-card" key={`${item.name}-${index}`} delay={index * 0.06}>
              <blockquote>{item.quote}</blockquote>
              <footer>
                <strong>{item.name}</strong>
                {item.role ? <span>{item.role}</span> : null}
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
