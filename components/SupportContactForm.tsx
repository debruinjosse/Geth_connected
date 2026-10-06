"use client";

import { Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHead } from "@/components/ui/Card";
import { Field, FieldGrid, Input, Select, Textarea } from "@/components/ui/Fields";

const supportEmail = "info@geth.pro";
const supportWhatsAppNumber = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER || "31613795467").replace(/[^\d]/g, "");

type SupportContactFormProps = {
  labels: {
    eyebrow: string;
    title: string;
    copy: string;
    name: string;
    email: string;
    company: string;
    requestType: string;
    message: string;
    emailAction: string;
    sending: string;
    replyTime: string;
    successTitle: string;
    successCopy: string;
    sendAnother: string;
    whatsappAction: string;
    required: string;
    errors: {
      name: string;
      email: string;
      message: string;
      messageLength: string;
    };
    requestTypes: string[];
  };
};

type SupportFormField = "name" | "email" | "message";
type SupportFormErrors = Partial<Record<SupportFormField, string>>;
type SupportStatus = "idle" | "ready";

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none">
      <path
        d="M8.88 25.26 4.75 26.34l1.1-3.98a11.52 11.52 0 0 1-1.63-5.92C4.22 9.9 9.54 4.58 16.08 4.58S27.94 9.9 27.94 16.44 22.62 28.3 16.08 28.3c-2.6 0-5.02-.84-7.2-3.04Z"
        fill="#25D366"
      />
      <path
        d="M12.04 10.26c-.25-.6-.52-.62-.76-.62h-.66c-.22 0-.58.08-.88.42-.3.33-1.16 1.14-1.16 2.78 0 1.64 1.19 3.23 1.36 3.45.17.22 2.32 3.73 5.72 5.08 2.83 1.12 3.4.9 4.02.84.61-.06 1.98-.8 2.26-1.58.28-.78.28-1.45.2-1.59-.08-.14-.31-.22-.65-.39-.34-.17-1.99-.98-2.3-1.09-.31-.11-.54-.17-.77.17-.23.34-.88 1.08-1.08 1.3-.2.23-.4.25-.74.09-.34-.17-1.43-.53-2.73-1.69-1.01-.9-1.69-2.01-1.89-2.35-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.08-.17-.75-1.82-1.07-2.36Z"
        fill="white"
      />
    </svg>
  );
}

export function SupportContactForm({ labels }: SupportContactFormProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    requestType: labels.requestTypes[0] ?? "Account help",
    message: ""
  });
  const [errors, setErrors] = useState<SupportFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SupportStatus>("idle");

  const supportMessage = useMemo(() => {
    return [
      "Hi GETH Support,",
      "",
      form.message || "We need help with GETH.",
      "",
      `Name: ${form.name || "-"}`,
      `Email: ${form.email || "-"}`,
      `Company: ${form.company || "-"}`,
      `Request type: ${form.requestType || "-"}`
    ].join("\n");
  }, [form]);

  const encodedMessage = encodeURIComponent(supportMessage);
  const mailtoHref = `mailto:${supportEmail}?subject=${encodeURIComponent("GETH support request")}&body=${encodedMessage}`;
  const whatsappHref = supportWhatsAppNumber ? `https://wa.me/${supportWhatsAppNumber}?text=${encodedMessage}` : "";

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "name" || field === "email" || field === "message") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
    setStatus("idle");
  }

  function validateForm() {
    const nextErrors: SupportFormErrors = {};
    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    if (!form.name.trim()) {
      nextErrors.name = labels.errors.name;
    }

    if (!emailIsValid) {
      nextErrors.email = labels.errors.email;
    }

    if (!form.message.trim()) {
      nextErrors.message = labels.errors.message;
    } else if (form.message.trim().length < 10) {
      nextErrors.message = labels.errors.messageLength;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function openExternalSupport(href: string) {
    try {
      const target = href.startsWith("https://") ? "_blank" : "_self";
      const opened = window.open(href, target, "noopener,noreferrer");

      if (target === "_blank" && !opened) {
        window.location.href = href;
        setStatus("ready");
        return false;
      }

      setStatus("ready");
      return true;
    } catch (error) {
      console.error("Support handoff failed", error);
      window.location.href = href;
      setStatus("ready");
      return false;
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    window.setTimeout(() => {
      openExternalSupport(mailtoHref);
      setIsSubmitting(false);
    }, 120);
  }

  function handleWhatsAppClick() {
    if (!validateForm() || !whatsappHref) return;
    openExternalSupport(whatsappHref);
  }

  function resetForm() {
    setForm({
      name: "",
      email: "",
      company: "",
      requestType: labels.requestTypes[0] ?? "Account help",
      message: ""
    });
    setErrors({});
    setStatus("idle");
  }

  function describedBy(field: SupportFormField) {
    return errors[field] ? `support-${field}-error` : undefined;
  }

  return (
    <Card as="form" size="lg" id="support-form" onSubmit={handleSubmit} noValidate>
      <CardHead eyebrow={labels.eyebrow} title={labels.title}>
        {labels.copy}
      </CardHead>

      {status === "ready" ? (
        <Alert tone="success" title={labels.successTitle} className="lp-mb">
          {labels.successCopy}{" "}
          <button type="button" onClick={resetForm} style={{ textDecoration: "underline", fontWeight: 500 }}>
            {labels.sendAnother}
          </button>
        </Alert>
      ) : null}

      <div className="lp-form">
        <FieldGrid>
          <Field label={labels.name} htmlFor="support-name" required requiredLabel={labels.required} error={errors.name}>
            <Input
              id="support-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Sarah van den Berg"
              autoComplete="name"
              invalid={Boolean(errors.name)}
              aria-describedby={describedBy("name")}
            />
          </Field>
          <Field label={labels.email} htmlFor="support-email" required requiredLabel={labels.required} error={errors.email}>
            <Input
              id="support-email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="sarah@company.com"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email")}
            />
          </Field>
          <Field label={labels.company} htmlFor="support-company">
            <Input id="support-company" value={form.company} onChange={(event) => updateField("company", event.target.value)} placeholder="GETH partner company" autoComplete="organization" />
          </Field>
          <Field label={labels.requestType} htmlFor="support-request-type">
            <Select id="support-request-type" value={form.requestType} onChange={(event) => updateField("requestType", event.target.value)}>
              {labels.requestTypes.map((requestType) => (
                <option key={requestType} value={requestType}>
                  {requestType}
                </option>
              ))}
            </Select>
          </Field>
          <Field className="lp-span-2" label={labels.message} htmlFor="support-message" required requiredLabel={labels.required} error={errors.message}>
            <Textarea
              id="support-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Tell us what you need help with."
              invalid={Boolean(errors.message)}
              aria-describedby={describedBy("message")}
            />
          </Field>
        </FieldGrid>

        <div className="lp-form-foot">
          <p>{labels.replyTime}</p>
          <div className="lp-actions">
            {whatsappHref ? (
              <Button variant="ghost" onClick={handleWhatsAppClick} icon={<WhatsAppIcon />}>
                {labels.whatsappAction}
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting} icon={<Mail aria-hidden="true" />}>
              {isSubmitting ? labels.sending : labels.emailAction}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
