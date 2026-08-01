"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_MARQUEE_SETTINGS,
  getDefaultMarqueeItemsForLocale,
  parseMarqueeItems
} from "@/lib/marquee-config";

function getSettingValue(key: string, defaults: Record<string, string>, overrides: Record<string, string>) {
  return overrides[key] || defaults[key] || DEFAULT_MARQUEE_SETTINGS[key] || "";
}

export function AdminMarqueeSection({
  locale,
  defaults,
  overrides,
  showSettings = true
}: {
  locale: "en" | "nl";
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  showSettings?: boolean;
}) {
  const storedItems = parseMarqueeItems(overrides.marqueeItems || defaults.marqueeItems);
  const initialItems = storedItems.length ? storedItems : getDefaultMarqueeItemsForLocale(locale);
  const [items, setItems] = useState(initialItems);

  function updateItem(index: number, value: string) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    setItems((current) => [...current, ""]);
  }

  const serializedItems = JSON.stringify(items.map((item) => item.trim()).filter(Boolean));
  const enabledValue = getSettingValue("marqueeEnabled", defaults, overrides);
  const scrollSpeedValue = getSettingValue("marqueeScrollSpeed", defaults, overrides);
  const backgroundColorValue = getSettingValue("marqueeBackgroundColor", defaults, overrides);
  const textColorValue = getSettingValue("marqueeTextColor", defaults, overrides);
  const dividerStyleValue = getSettingValue("marqueeDividerStyle", defaults, overrides);

  return (
    <div className="admin-marquee-section">
      {showSettings ? (
        <div className="admin-site-content-grid">
          <div className="form-field">
            <label htmlFor={`${locale}-marqueeEnabled`}>Enable marquee</label>
            <select id={`${locale}-marqueeEnabled`} className="input" name="marqueeEnabled" defaultValue={enabledValue === "0" ? "0" : "1"}>
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor={`${locale}-marqueeScrollSpeed`}>Scroll speed (seconds, lower = faster)</label>
            <input
              id={`${locale}-marqueeScrollSpeed`}
              className="input"
              name="marqueeScrollSpeed"
              type="number"
              min={8}
              max={120}
              step={1}
              defaultValue={scrollSpeedValue || "42"}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`${locale}-marqueeBackgroundColor`}>Background colour</label>
            <input
              id={`${locale}-marqueeBackgroundColor`}
              className="input admin-color-input"
              name="marqueeBackgroundColor"
              type="color"
              defaultValue={backgroundColorValue || "#fffdf8"}
            />
            <span className="field-help">Leave as default or pick a custom colour.</span>
          </div>
          <div className="form-field">
            <label htmlFor={`${locale}-marqueeTextColor`}>Text colour</label>
            <input
              id={`${locale}-marqueeTextColor`}
              className="input admin-color-input"
              name="marqueeTextColor"
              type="color"
              defaultValue={textColorValue || "#2a173d"}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`${locale}-marqueeDividerStyle`}>Divider style</label>
            <select
              id={`${locale}-marqueeDividerStyle`}
              className="input"
              name="marqueeDividerStyle"
              defaultValue={dividerStyleValue || "line"}
            >
              <option value="line">Line</option>
              <option value="dot">Dot</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      ) : null}

      <div className="admin-marquee-items">
        <div className="admin-marquee-items-header">
          <strong>Marquee text items</strong>
          <button className="btn btn-secondary compact" type="button" onClick={addItem}>
            <Plus size={14} />
            Add item
          </button>
        </div>
        {items.length ? (
          <div className="admin-marquee-items-list">
            {items.map((item, index) => (
              <div className="admin-marquee-item-row" key={`marquee-item-${index}`}>
                <input
                  className="input"
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder="Recognition That Lasts"
                />
                <div className="admin-marquee-item-actions">
                  <button
                    className="btn btn-secondary compact icon-only"
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    className="btn btn-secondary compact icon-only"
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    className="btn btn-secondary compact icon-only"
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="field-help">No items yet. Add text to show in the scrolling bar.</p>
        )}
      </div>

      <input type="hidden" name="marqueeItems" value={serializedItems} readOnly />
    </div>
  );
}
