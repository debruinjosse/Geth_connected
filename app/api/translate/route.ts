import { NextRequest, NextResponse } from "next/server";

const allowedLanguages = new Set(["en", "nl", "fr", "de", "es", "ar", "ur"]);

function getGoogleTranslateUrl(sourceUrl: string, targetLanguage: string) {
  const translateUrl = new URL("https://translate.google.com/translate");
  translateUrl.searchParams.set("sl", "auto");
  translateUrl.searchParams.set("tl", targetLanguage);
  translateUrl.searchParams.set("u", sourceUrl);
  return translateUrl.toString();
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    targetLanguage?: string;
    sourceUrl?: string;
    pathname?: string;
  };

  const targetLanguage = payload.targetLanguage?.toLowerCase();
  const sourceUrl = payload.sourceUrl;

  if (!targetLanguage || !allowedLanguages.has(targetLanguage) || !sourceUrl) {
    return NextResponse.json({ error: "INVALID_TRANSLATION_REQUEST" }, { status: 400 });
  }

  const fallbackUrl = getGoogleTranslateUrl(sourceUrl, targetLanguage);
  const n8nWebhookUrl = process.env.N8N_TRANSLATE_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    return NextResponse.json({
      provider: "google_translate_fallback",
      translatedUrl: fallbackUrl
    });
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetLanguage,
        sourceUrl,
        pathname: payload.pathname ?? null,
        fallbackUrl,
        product: "GETH Connected Cards"
      })
    });

    const n8nPayload = (await response.json().catch(() => ({}))) as {
      translatedUrl?: string;
      redirectUrl?: string;
      url?: string;
    };

    return NextResponse.json({
      provider: "n8n",
      translatedUrl: n8nPayload.translatedUrl || n8nPayload.redirectUrl || n8nPayload.url || fallbackUrl
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("n8n translation webhook failed", error);
    }

    return NextResponse.json({
      provider: "google_translate_fallback",
      translatedUrl: fallbackUrl,
      warning: "N8N_TRANSLATE_FAILED"
    });
  }
}
