"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { parseTestimonialItems, type TestimonialItem } from "@/lib/home-cms-defaults";

export function AdminTestimonialsSection({
  locale,
  defaults,
  overrides
}: {
  locale: "en" | "nl";
  defaults: Record<string, string>;
  overrides: Record<string, string>;
}) {
  const stored = parseTestimonialItems(overrides.testimonialsItems || defaults.testimonialsItems);
  const [items, setItems] = useState<TestimonialItem[]>(stored.length ? stored : [{ quote: "", name: "", role: "" }]);

  function updateItem(index: number, field: keyof TestimonialItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    setItems((current) => [...current, { quote: "", name: "", role: "" }]);
  }

  const serializedItems = JSON.stringify(
    items
      .map((item) => ({
        quote: item.quote.trim(),
        name: item.name.trim(),
        role: item.role.trim()
      }))
      .filter((item) => item.quote)
  );

  return (
    <div className="admin-marquee-items">
      <div className="admin-marquee-items-header">
        <strong>Testimonial items</strong>
        <button className="btn btn-secondary compact" type="button" onClick={addItem}>
          <Plus size={14} />
          Add testimonial
        </button>
      </div>
      {items.length ? (
        <div className="admin-testimonials-list">
          {items.map((item, index) => (
            <div className="admin-testimonial-card" key={`testimonial-${index}`}>
              <div className="form-field">
                <label htmlFor={`${locale}-testimonial-quote-${index}`}>Quote</label>
                <textarea
                  id={`${locale}-testimonial-quote-${index}`}
                  className="input"
                  rows={3}
                  value={item.quote}
                  onChange={(event) => updateItem(index, "quote", event.target.value)}
                />
              </div>
              <div className="admin-site-content-grid">
                <div className="form-field">
                  <label htmlFor={`${locale}-testimonial-name-${index}`}>Name</label>
                  <input
                    id={`${locale}-testimonial-name-${index}`}
                    className="input"
                    value={item.name}
                    onChange={(event) => updateItem(index, "name", event.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`${locale}-testimonial-role-${index}`}>Role / company</label>
                  <input
                    id={`${locale}-testimonial-role-${index}`}
                    className="input"
                    value={item.role}
                    onChange={(event) => updateItem(index, "role", event.target.value)}
                  />
                </div>
              </div>
              <div className="admin-marquee-item-actions">
                <button
                  className="btn btn-secondary compact icon-only"
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="btn btn-secondary compact icon-only"
                  type="button"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="btn btn-secondary compact icon-only"
                  type="button"
                  aria-label="Remove testimonial"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="field-help">No testimonials yet.</p>
      )}
      <input type="hidden" name="testimonialsItems" value={serializedItems} readOnly />
    </div>
  );
}
