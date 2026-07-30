"use client";

import { useState } from "react";
import { updateSiteContentAction } from "@/app/actions/siteContent";
import { HOME_CONTENT_FIELDS } from "@/lib/site-content-fields";

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

      <div className="admin-site-content-grid">
        {HOME_CONTENT_FIELDS.map((field) => {
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
