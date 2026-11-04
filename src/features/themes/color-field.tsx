"use client";

import { FieldError, FieldLabel, useField } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";

const HEX6 = /^#[0-9a-f]{6}$/i;

/**
 * A color: the browser's swatch picker next to the hex value, which can be
 * typed or pasted too. What is stored is the hex string.
 */
export const ColorField = ({ field, path }: TextFieldClientProps) => {
  const { value, setValue, showError, errorMessage } = useField<string>({
    path: path ?? field.name,
  });
  const color = value ?? "";
  const swatch = HEX6.test(color)
    ? color
    : /^#[0-9a-f]{3}$/i.test(color)
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      : "#ffffff";
  const description = field.admin?.description;
  return (
    <div className="field-type text" style={{ flex: 1 }}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          aria-label={`${typeof field.label === "string" ? field.label : field.name} – pick`}
          onChange={(event) => setValue(event.target.value)}
          style={{
            width: 40,
            height: 40,
            flex: "none",
            padding: 2,
            cursor: "pointer",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: 6,
            background: "none",
          }}
          type="color"
          value={swatch}
        />
        <input
          className="input"
          onChange={(event) => setValue(event.target.value.trim())}
          placeholder="#ff5c8a"
          style={{ flex: 1, minWidth: 0 }}
          type="text"
          value={color}
        />
      </div>
      {showError && <FieldError message={errorMessage} path={path} />}
      {typeof description === "string" && (
        <div className="field-description" style={{ marginTop: 6 }}>
          {description}
        </div>
      )}
    </div>
  );
};
