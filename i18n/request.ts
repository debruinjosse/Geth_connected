import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale;

  const englishMessages = (await import("../messages/en.json")).default;
  const localeMessages = locale === "en" ? englishMessages : (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: {
      ...englishMessages,
      ...localeMessages
    },
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Missing or invalid translation", error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      const fallbackKey = [namespace, key].filter(Boolean).join(".");
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation fallback used: ${fallbackKey}`);
      }
      return "";
    }
  };
});
