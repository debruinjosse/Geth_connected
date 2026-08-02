"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

type DemoField = {
  id: string;
  label: string;
  placeholder?: string;
};

export function InlineDemoForm({
  title,
  description,
  buttonLabel,
  fields
}: {
  title: string;
  description: string;
  buttonLabel: string;
  fields: DemoField[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const tc = useTranslations("common");

  if (submitted) {
    return (
      <div className="panel inline-form-success">
        <CheckCircle2 size={34} color="var(--theme-emerald)" />
        <strong>{title} {tc("demoSaved")}</strong>
        <p>{description}</p>
      </div>
    );
  }

  return (
    <form
      className="panel inline-demo-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="panel-top">
        <div>
          <h3>{title}</h3>
          <p style={{ margin: "8px 0 0", color: "var(--theme-muted)" }}>{description}</p>
        </div>
      </div>
      <div className="form-grid">
        {fields.map((field) => (
          <div className="form-field" key={field.id}>
            <label htmlFor={field.id}>{field.label}</label>
            <input id={field.id} className="input" placeholder={field.placeholder} />
          </div>
        ))}
      </div>
      <button className="btn btn-primary" type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}
