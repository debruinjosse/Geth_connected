"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Textarea } from "@/components/ui/Fields";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteContentAction } from "@/app/actions/siteContent";
import { AdminMarqueeSection } from "@/components/AdminMarqueeSection";
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
    <FieldGrid>
      {fields.map((field, index) => {
        const spanFull = field.multiline || isLoneField(fields, index);
        const defaultValue = overrides[field.key] || defaults[field.key] || "";
        return (
          <Field key={field.key} label={field.label} htmlFor={`${locale}-${field.key}`} hint={`Key: home.${field.key}`} className={spanFull ? "lp-span-2" : undefined}>
            {field.multiline ? (
              <Textarea id={`${locale}-${field.key}`} name={field.key} rows={4} defaultValue={defaultValue} />
            ) : (
              <Input id={`${locale}-${field.key}`} name={field.key} defaultValue={defaultValue} />
            )}
          </Field>
        );
      })}
    </FieldGrid>
  );
}

function isLoneField(fields: { multiline?: boolean }[], index: number) {
  // A single-line field that would end up alone in its row spans the full width.
  let start = index;
  while (start > 0 && !fields[start - 1].multiline) start -= 1;
  let end = index;
  while (end < fields.length - 1 && !fields[end + 1].multiline) end += 1;
  const runLength = end - start + 1;
  return runLength % 2 === 1 && index === end;
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
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  return (
    <form
      className="lp-cms-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus("saving");
        setError("");
        setErrorCode(null);
        const formData = new FormData(event.currentTarget);
        const result = await updateSiteContentAction(formData);
        if (!result.ok) {
          setStatus("error");
          setError(result.error);
          setErrorCode(result.code);
          return;
        }
        setStatus("saved");
        router.refresh();
        window.setTimeout(() => setStatus("idle"), 2500);
      }}
    >
      <input type="hidden" name="namespace" value="home" />
      <input type="hidden" name="locale" value={locale} />

      {HOME_CMS_SECTIONS.map((section) => (
        <div className="lp-cms-section" key={section.id}>
          <h3>{section.title}</h3>
          {section.description ? <p className="lp-hint">{section.description}</p> : null}

          {section.id === "marquee" ? (
            <AdminMarqueeSection
              locale={locale}
              defaults={defaults}
              overrides={overrides}
              showSettings={locale === "en"}
            />
          ) : (
            <SiteContentFieldGrid fields={section.fields} locale={locale} defaults={defaults} overrides={overrides} />
          )}
        </div>
      ))}

      <div className="lp-form-foot">
        <div>
          {status === "saved" ? <Alert tone="success">Saved. Open the public homepage to preview your changes.</Alert> : null}
          {status === "error" ? (
            <Alert tone="error">
              {error}
              {errorCode === "AUTH_EXPIRED" ? (
                <>
                  {" "}
                  <a className="lp-link" href={`/${locale}/login?next=/${locale}/admin/site-content`}>Sign in again</a>.
                </>
              ) : null}
            </Alert>
          ) : null}
        </div>
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : `Save ${locale.toUpperCase()} homepage`}
        </Button>
      </div>
    </form>
  );
}
