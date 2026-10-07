"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Select } from "@/components/ui/Fields";
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
    <div className="lp-marquee-section">
      {showSettings ? (
        <FieldGrid>
          <Field label="Enable marquee" htmlFor={`${locale}-marqueeEnabled`}>
            <Select id={`${locale}-marqueeEnabled`} name="marqueeEnabled" defaultValue={enabledValue === "0" ? "0" : "1"}>
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </Select>
          </Field>
          <Field label="Scroll speed (seconds, lower = faster)" htmlFor={`${locale}-marqueeScrollSpeed`}>
            <Input id={`${locale}-marqueeScrollSpeed`} name="marqueeScrollSpeed" type="number" min={8} max={120} step={1} defaultValue={scrollSpeedValue || "42"} />
          </Field>
          <Field label="Background colour" htmlFor={`${locale}-marqueeBackgroundColor`} hint="Leave as default or pick a custom colour.">
            <Input id={`${locale}-marqueeBackgroundColor`} className="lp-color-input" name="marqueeBackgroundColor" type="color" defaultValue={backgroundColorValue || "#fffdf8"} />
          </Field>
          <Field label="Text colour" htmlFor={`${locale}-marqueeTextColor`}>
            <Input id={`${locale}-marqueeTextColor`} className="lp-color-input" name="marqueeTextColor" type="color" defaultValue={textColorValue || "#2a173d"} />
          </Field>
          <Field label="Divider style" htmlFor={`${locale}-marqueeDividerStyle`} className="lp-span-2">
            <Select id={`${locale}-marqueeDividerStyle`} name="marqueeDividerStyle" defaultValue={dividerStyleValue || "line"}>
              <option value="line">Line</option>
              <option value="dot">Dot</option>
              <option value="none">None</option>
            </Select>
          </Field>
        </FieldGrid>
      ) : null}

      <div className="lp-marquee-items">
        <div className="lp-marquee-items-header">
          <strong>Marquee text items</strong>
          <Button variant="ghost" size="sm" type="button" onClick={addItem} icon={<Plus />}>Add item</Button>
        </div>
        {items.length ? (
          <div className="lp-marquee-items-list">
            {items.map((item, index) => (
              <div className="lp-marquee-item-row" key={`marquee-item-${index}`}>
                <input
                  className="lp-input"
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder="Recognition That Lasts"
                />
                <div className="lp-marquee-item-actions">
                  <button
                    className="lp-icon-btn"
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="lp-icon-btn"
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="lp-icon-btn"
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="lp-hint">No items yet. Add text to show in the scrolling bar.</p>
        )}
      </div>

      <input type="hidden" name="marqueeItems" value={serializedItems} readOnly />
    </div>
  );
}
