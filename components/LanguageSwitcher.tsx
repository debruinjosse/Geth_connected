"use client";

import { useState } from "react";
import { Globe2, Loader2 } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "nl", label: "Dutch" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "ar", label: "Arabic" },
  { code: "ur", label: "Urdu" }
];

function getGoogleTranslateUrl(targetLanguage: string) {
  const currentUrl = window.location.href;
  const translateUrl = new URL("https://translate.google.com/translate");
  translateUrl.searchParams.set("sl", "auto");
  translateUrl.searchParams.set("tl", targetLanguage);
  translateUrl.searchParams.set("u", currentUrl);
  return translateUrl.toString();
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function translateTo(targetLanguage: string) {
    setLanguage(targetLanguage);
    setBusy(true);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetLanguage,
          sourceUrl: window.location.href,
          pathname: window.location.pathname
        })
      });

      const payload = (await response.json().catch(() => ({}))) as {
        translatedUrl?: string;
        redirectUrl?: string;
        url?: string;
      };
      const redirectUrl = payload.translatedUrl || payload.redirectUrl || payload.url;

      if (response.ok && redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
    } catch {
      // Fall through to Google Translate when n8n is unavailable.
    }

    window.location.assign(getGoogleTranslateUrl(targetLanguage));
  }

  return (
    <div className="language-switcher">
      <button
        className="language-switcher-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Translate site"
      >
        {busy ? <Loader2 className="language-spinner" size={17} /> : <Globe2 size={17} />}
        <span>{language.toUpperCase()}</span>
      </button>

      {open ? (
        <div className="language-switcher-menu" role="menu" aria-label="Choose language">
          {languages.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitem"
              disabled={busy}
              className={item.code === language ? "active" : ""}
              onClick={() => translateTo(item.code)}
            >
              <span>{item.label}</span>
              <small>{item.code.toUpperCase()}</small>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
