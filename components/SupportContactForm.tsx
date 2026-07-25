"use client";

import { CheckCircle2, Mail } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

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
    <svg aria-hidden="true" className="whatsapp-icon" viewBox="0 0 32 32" fill="none">
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
    <form className="panel support-form-panel" id="support-form" onSubmit={handleSubmit}>
      <div className="support-form-header">
        <div className="eyebrow support-form-eyebrow">{labels.eyebrow}</div>
        <h2>{labels.title}</h2>
        <p>{labels.copy}</p>
      </div>

      {status === "ready" ? (
        <div className="support-success-panel" role="status" aria-live="polite">
          <CheckCircle2 aria-hidden="true" size={22} />
          <div>
            <strong>{labels.successTitle}</strong>
            <span>{labels.successCopy}</span>
          </div>
          <button type="button" className="support-reset-button" onClick={resetForm}>
            {labels.sendAnother}
          </button>
        </div>
      ) : null}

      <div className="support-field-grid">
        <div className="support-field">
          <label htmlFor="support-name">
            {labels.name}
            <span aria-label={labels.required}>*</span>
          </label>
          <input
            id="support-name"
            className="support-input"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Sarah van den Berg"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy("name")}
          />
          {errors.name ? (
            <small className="support-field-error" id="support-name-error">
              {errors.name}
            </small>
          ) : null}
        </div>
        <div className="support-field">
          <label htmlFor="support-email">
            {labels.email}
            <span aria-label={labels.required}>*</span>
          </label>
          <input
            id="support-email"
            className="support-input"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="sarah@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errors.email ? (
            <small className="support-field-error" id="support-email-error">
              {errors.email}
            </small>
          ) : null}
        </div>
        <div className="support-field">
          <label htmlFor="support-company">{labels.company}</label>
          <input
            id="support-company"
            className="support-input"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="GETH partner company"
          />
        </div>
        <div className="support-field">
          <label htmlFor="support-request-type">{labels.requestType}</label>
          <select
            id="support-request-type"
            className="support-input support-select"
            value={form.requestType}
            onChange={(event) => updateField("requestType", event.target.value)}
          >
            {labels.requestTypes.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </select>
        </div>
        <div className="support-field support-message-field">
          <label htmlFor="support-message">
            {labels.message}
            <span aria-label={labels.required}>*</span>
          </label>
          <textarea
            id="support-message"
            className="support-input"
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Tell us what you need help with."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy("message")}
          />
          {errors.message ? (
            <small className="support-field-error" id="support-message-error">
              {errors.message}
            </small>
          ) : null}
        </div>
      </div>

      <div className="support-actions">
        <p>{labels.replyTime}</p>
        <div className="support-action-buttons">
          {whatsappHref ? (
            <button className="btn btn-whatsapp" type="button" onClick={handleWhatsAppClick}>
              <WhatsAppIcon />
              {labels.whatsappAction}
            </button>
          ) : null}
          <button className="btn btn-primary support-submit-button" type="submit" disabled={isSubmitting}>
            <Mail aria-hidden="true" size={18} />
            {isSubmitting ? labels.sending : labels.emailAction}
          </button>
        </div>
      </div>
    </form>
  );
}
