"use client";

import { useLocale, useTranslations } from "next-intl";
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

export function RecognitionList({
  items,
  compact = false
}: {
  items: Array<RecognitionItem | StoredRecognition>;
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("common");

  return (
    <div className="recognition-list">
      {items.map((item) => {
        const from = "giverName" in item ? item.giverName : item.from;
        const note = "cardTitle" in item ? item.note ?? "" : item.note;
        const card = "cardTitle" in item ? item.cardTitle : item.card;
        const date =
          "cardTitle" in item
            ? formatRecognitionDate(item.createdAt, locale)
            : item.date ?? (item.createdAt ? formatRecognitionDate(item.createdAt, locale) : "");

        return (
          <div className="recognition-item" key={item.id}>
            <div className="avatar">{from.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
            <div className="recognition-copy" style={{ flex: 1 }}>
              <strong>{card}</strong>
              <p>{note || t("noPersonalNote")}</p>
            </div>
            <div style={{ textAlign: "right", minWidth: compact ? 88 : 120 }}>
              <strong>{from}</strong>
              <p style={{ margin: "4px 0 0" }}>{date}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
