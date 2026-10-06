"use client";

import { useLocale, useTranslations } from "next-intl";
import { Feed, FeedItem } from "@/components/ui/Feed";
import { formatRecognitionDate, type StoredRecognition } from "@/lib/demo-session";

export type RecognitionItem = {
  id: string;
  from: string;
  to?: string;
  card: string;
  category: string;
  note: string;
  date?: string;
  createdAt?: string;
};

/** Received / given recognitions as a quiet feed: avatar, card, note, sender and date. */
export function RecognitionList({
  items
}: {
  items: Array<RecognitionItem | StoredRecognition>;
  /** kept for API compatibility with older callers */
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <Feed>
      {items.map((item) => {
        const from = "giverName" in item ? item.giverName : item.from;
        const note = "cardTitle" in item ? item.note ?? "" : item.note;
        const card = "cardTitle" in item ? item.cardTitle : item.card;
        const date =
          "cardTitle" in item
            ? formatRecognitionDate(item.createdAt, locale)
            : item.date ?? (item.createdAt ? formatRecognitionDate(item.createdAt, locale) : "");

        return <FeedItem key={item.id} avatar={from} title={card} note={note || t("noPersonalNote")} meta={from} metaSub={date} />;
      })}
    </Feed>
  );
}
