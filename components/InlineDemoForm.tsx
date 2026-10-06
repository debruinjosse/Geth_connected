"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Fields";
import { Panel } from "@/components/ui/Panel";

type DemoField = {
  id: string;
  label: string;
  placeholder?: string;
};

/** Demo-mode form: collects nothing, just shows a success message. */
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
      <Panel>
        <Alert tone="success" title={`${title} ${tc("demoSaved")}`}>
          {description}
        </Alert>
      </Panel>
    );
  }

  return (
    <Panel title={title} description={description}>
      <form
        className="lp-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        {fields.map((field) => (
          <Field key={field.id} label={field.label} htmlFor={field.id}>
            <Input id={field.id} placeholder={field.placeholder} />
          </Field>
        ))}
        <div>
          <Button type="submit">{buttonLabel}</Button>
        </div>
      </form>
    </Panel>
  );
}
