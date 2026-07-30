import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale } from "@/i18n/routing";

type MessageTree = Record<string, unknown>;

function isRecord(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const merged: MessageTree = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = merged[key];
    if (isRecord(baseValue) && isRecord(overrideValue)) {
      merged[key] = deepMergeMessages(baseValue, overrideValue);
    } else {
      merged[key] = overrideValue;
    }
  }

  return merged;
}

function getNestedMessage(messages: MessageTree, namespace?: string, key?: string): string | undefined {
  const path = [namespace, key].filter(Boolean).join(".");
  if (!path) {
    return undefined;
  }

  let current: unknown = messages;
  for (const part of path.split(".")) {
    if (!isRecord(current) || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : undefined;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale;

  const englishMessages = (await import("../messages/en.json")).default as MessageTree;
  const localeMessages =
    locale === "en" ? englishMessages : ((await import(`../messages/${locale}.json`)).default as MessageTree);

  const messages =
    locale === "en" ? englishMessages : deepMergeMessages(englishMessages, localeMessages);

  return {
    locale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Missing or invalid translation", error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      const english = getNestedMessage(englishMessages, namespace, key);
      if (english) {
        return english;
      }

      const fallbackKey = [namespace, key].filter(Boolean).join(".");
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation fallback used: ${fallbackKey}`);
      }
      return fallbackKey;
    }
  };
});
