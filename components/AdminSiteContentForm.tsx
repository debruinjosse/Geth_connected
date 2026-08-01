"use client";

import { useState } from "react";
import { updateSiteContentAction } from "@/app/actions/siteContent";
import { AdminMarqueeSection } from "@/components/AdminMarqueeSection";
import { AdminTestimonialsSection } from "@/components/AdminTestimonialsSection";
import { HOME_CMS_SECTIONS, type SiteContentField } from "@/lib/site-content-fields";

function SiteContentFieldGrid({
  fields,
  locale,
  defaults,
  overrides
}: {
  fields: SiteContentField[];
  locale: "en" | "nl";
  defaults: Record<string, string>;
  overrides: Record<string, string>;
}) {
  return (
    <div className="admin-site-content-grid">
      {fields.map((field) => {
        const defaultValue = overrides[field.key] || defaults[field.key] || "";
        return (
          <div className="form-field" key={field.key}>
            <label htmlFor={`${locale}-${field.key}`}>{field.label}</label>
            {field.multiline ? (
              <textarea
                id={`${locale}-${field.key}`}
                className="input"
                name={field.key}
                rows={4}
                defaultValue={defaultValue}
              />
            ) : (
              <input id={`${locale}-${field.key}`} className="input" name={field.key} defaultValue={defaultValue} />
            )}
            <span className="field-help">Key: home.{field.key}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AdminSiteContentForm({
  locale,
  defaults,
  overrides
}: {
  locale: "en" | "nl";
  defaults: Record<string, string>;
  overrides: Record<string, string>;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  return (
    <form
      className="admin-site-content-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("saving");
        setError("");
        const formData = new FormData(event.currentTarget);
        const result = await updateSiteContentAction(formData);
        if (!result.ok) {
          setStatus("error");
          setError(result.error);
          return;
        }
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 2500);
      }}
    >
      <input type="hidden" name="namespace" value="home" />
      <input type="hidden" name="locale" value={locale} />

      {HOME_CMS_SECTIONS.map((section) => (
        <div className="admin-site-content-section" key={section.id}>
          <h3>{section.title}</h3>
          {section.description ? <p className="section-copy">{section.description}</p> : null}

          {section.id === "marquee" ? (
            <AdminMarqueeSection
              locale={locale}
              defaults={defaults}
              overrides={overrides}
              showSettings={locale === "en"}
            />
          ) : section.id === "testimonials" ? (
            <>
              <SiteContentFieldGrid
                fields={section.fields}
                locale={locale}
                defaults={defaults}
                overrides={overrides}
              />
              <AdminTestimonialsSection locale={locale} defaults={defaults} overrides={overrides} />
            </>
          ) : (
            <SiteContentFieldGrid fields={section.fields} locale={locale} defaults={defaults} overrides={overrides} />
          )}
        </div>
      ))}

      <div className="admin-site-content-actions">
        <button className="btn btn-primary" type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : `Save ${locale.toUpperCase()} homepage`}
        </button>
        {status === "saved" ? <span className="field-help success">Saved. Refresh the public homepage to preview.</span> : null}
        {status === "error" ? <span className="field-help error">{error}</span> : null}
      </div>
    </form>
  );
}
