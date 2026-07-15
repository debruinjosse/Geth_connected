"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";

export function GoogleTranslateWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement || document.getElementById("google_translate_element")?.children.length) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,nl,fr,da",
          autoDisplay: false
        },
        "google_translate_element"
      );
    };

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      window.googleTranslateElementInit();
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className={`google-translate-widget ${open ? "open" : ""}`.trim()}>
      {open ? (
        <div className="google-translate-panel">
          <div className="google-translate-head">
            <strong>Translate site</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close translation panel">
              <X size={15} />
            </button>
          </div>
          <p>Use automatic Google Translate for quick language switching.</p>
          <div id="google_translate_element" />
        </div>
      ) : null}
      <button className="google-translate-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-label="Translate website">
        <Languages size={18} />
        Translate
      </button>
    </div>
  );
}
