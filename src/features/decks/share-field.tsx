"use client";

import { Button, useFormFields } from "@payloadcms/ui";
import QRCode from "qrcode";
import { type CSSProperties, useEffect, useState } from "react";

const COLORS = { dark: "#0b1533", light: "#ffffff" };

const styles = {
  box: { marginBottom: "1.5rem" },
  label: {
    margin: "0 0 0.5rem",
    fontSize: "0.8rem",
    color: "var(--theme-elevation-600)",
  },
  row: { display: "flex", gap: "0.75rem", alignItems: "flex-start" },
  side: { display: "flex", flex: 1, minWidth: 0, flexDirection: "column" },
  code: {
    display: "block",
    flex: "none",
    width: 88,
    height: 88,
    borderRadius: "var(--style-radius-m)",
    border: "1px solid var(--theme-elevation-100)",
    background: COLORS.light,
  },
  url: {
    margin: "0 0 0.5rem",
    fontFamily: "ui-monospace, monospace",
    fontSize: "0.75rem",
    overflowWrap: "anywhere",
    color: "var(--theme-elevation-700)",
  },
  buttons: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.4rem",
  },
  empty: {
    margin: 0,
    fontSize: "0.85rem",
    color: "var(--theme-elevation-600)",
  },
} satisfies Record<string, CSSProperties>;

/** A file to the browser's downloads. */
const save = (href: string, name: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
};

/**
 * The deck's address to share, in the sidebar: a QR code of it, the link –
 * to copy – and the code as a picture, to copy or to download (PNG, SVG).
 * The saved address only: an unsaved one leads nowhere yet.
 */
export const ShareField = () => {
  const slug = useFormFields(
    ([fields]) => fields.slug?.initialValue as string | undefined
  );
  const [origin, setOrigin] = useState("");
  const [svg, setSvg] = useState("");
  const [done, setDone] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const url = slug && origin ? `${origin}/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    let on = true;
    QRCode.toString(url, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: COLORS,
    }).then((code) => on && setSvg(code));
    return () => {
      on = false;
    };
  }, [url]);

  const say = (what: string) => {
    setDone(what);
    window.setTimeout(() => setDone(null), 1800);
  };

  const png = () =>
    QRCode.toDataURL(url, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: COLORS,
    });

  if (!url) {
    return (
      <div style={styles.box}>
        <p style={styles.label}>Share</p>
        <p style={styles.empty}>Save the deck – then its QR code is here.</p>
      </div>
    );
  }

  return (
    <div style={styles.box}>
      <p style={styles.label}>Share</p>
      <div style={styles.row}>
        {svg ? (
          <img
            alt={`QR code for ${url}`}
            src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
            style={styles.code}
          />
        ) : (
          <span style={styles.code} />
        )}
        <div style={styles.side}>
          <p style={styles.url}>{url}</p>
          <div style={styles.buttons}>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                say("link");
              }}
              size="small"
            >
              {done === "link" ? "Copied ✓" : "Copy link"}
            </Button>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={async () => {
                try {
                  const blob = await (await fetch(await png())).blob();
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);
                  say("code");
                } catch {
                  say("no-copy");
                }
              }}
              size="small"
            >
              {done === "code"
                ? "Copied ✓"
                : done === "no-copy"
                  ? "Not here ✗"
                  : "Copy QR"}
            </Button>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={async () => save(await png(), `${slug}-qr.png`)}
              size="small"
            >
              PNG ↓
            </Button>
            <Button
              buttonStyle="secondary"
              margin={false}
              onClick={() => {
                const href = URL.createObjectURL(
                  new Blob([svg], { type: "image/svg+xml" })
                );
                save(href, `${slug}-qr.svg`);
                window.setTimeout(() => URL.revokeObjectURL(href), 1000);
              }}
              size="small"
            >
              SVG ↓
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
