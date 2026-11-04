"use client";

import {
  Button,
  ExternalLinkIcon,
  FieldError,
  FieldLabel,
  useDocumentInfo,
  useField,
  useFormFields,
} from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { type CSSProperties, useEffect, useState } from "react";
import { slugify } from "./slug";

/** A padlock, shut or open. */
const Padlock = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="16"
  >
    <rect height="10" rx="2" width="14" x="5" y="11" />
    <path d={open ? "M8 11V7a4 4 0 0 1 7.6-1.7" : "M8 11V7a4 4 0 0 1 8 0v4"} />
  </svg>
);

/** While typing: small letters and dashes – a dash at the end may stay. */
const typing = (text: string) =>
  slugify(`${text}x`).replace(/x$/, "") +
  (/[\s\-_]$/.test(text) && text.length > 1 ? "-" : "");

const styles = {
  row: { display: "flex", gap: "0.4rem", alignItems: "stretch" },
  box: {
    display: "flex",
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: "var(--style-radius-s)",
    background: "var(--theme-input-bg)",
    paddingInline: "0.6rem",
  },
  slash: { color: "var(--theme-elevation-500)" },
  input: {
    flex: 1,
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "var(--theme-text)",
    font: "inherit",
    paddingBlock: "0.55rem",
  },
  hint: {
    marginTop: "0.4rem",
    fontSize: "0.8rem",
    color: "var(--theme-elevation-600)",
  },
} satisfies Record<string, CSSProperties>;

/**
 * The address field: `/slug`, with a padlock and a way to the page.
 *
 * Shut (the default), it can't be typed in. A new document's address
 * follows its title; a saved one's stays as it is – links already sent go
 * on working when the title changes. Open the padlock to write it by hand.
 * ↗ opens the page (the saved address) in a new tab.
 */
export const SlugField = ({ field, path }: TextFieldClientProps) => {
  const fieldPath = path ?? field.name;
  const { value, setValue, initialValue, showError, errorMessage } =
    useField<string>({ path: fieldPath });
  const title = useFormFields(
    ([fields]) => fields.title?.value as string | undefined
  );
  const { id } = useDocumentInfo();
  const [locked, setLocked] = useState(true);
  const saved = typeof initialValue === "string" ? initialValue : "";
  const current = value ?? "";

  // New and shut: the address follows the title.
  useEffect(() => {
    if (!locked || id) return;
    const next = slugify(title ?? "");
    if (next !== current) setValue(next);
  }, [locked, id, title, current, setValue]);

  const changed = Boolean(id && saved && current !== saved);

  return (
    <div className="field-type text" style={{ marginBottom: "1.2rem" }}>
      <FieldLabel
        label={field.label ?? "Address"}
        path={fieldPath}
        required={field.required}
      />
      <div style={styles.row}>
        <label style={styles.box}>
          <span style={styles.slash}>/</span>
          <input
            aria-label="Address"
            onBlur={() => setValue(slugify(current))}
            onChange={(event) => setValue(typing(event.target.value))}
            placeholder={locked ? "from the title" : "my-talk"}
            readOnly={locked}
            style={{ ...styles.input, opacity: locked ? 0.75 : 1 }}
            type="text"
            value={current}
          />
        </label>
        <Button
          aria-label={locked ? "Unlock the address" : "Lock the address"}
          buttonStyle="secondary"
          icon={<Padlock open={!locked} />}
          margin={false}
          onClick={() => setLocked((l) => !l)}
          size="small"
          tooltip={locked ? "Unlock to edit" : "Lock"}
        />
        <Button
          aria-label="Open the page"
          buttonStyle="secondary"
          disabled={!saved}
          el="anchor"
          icon={<ExternalLinkIcon />}
          margin={false}
          newTab
          size="small"
          tooltip={saved ? `Open /${saved}` : "Save first"}
          url={saved ? `/${saved}` : undefined}
        />
      </div>
      {showError && <FieldError message={errorMessage} path={fieldPath} />}
      <p style={styles.hint}>
        {changed
          ? "A new address – links sent with the old one stop working."
          : locked
            ? id
              ? "Locked: stays when the title changes."
              : "Follows the title until unlocked."
            : "Small letters, digits and dashes."}
      </p>
    </div>
  );
};
