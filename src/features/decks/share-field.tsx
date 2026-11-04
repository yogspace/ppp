"use client";

import { Button, useFormFields } from "@payloadcms/ui";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const muted = { color: "var(--theme-elevation-400)", fontSize: 12, margin: 0 };

/** For a second: what was just done. */
const useFlash = () => {
  const [flash, setFlash] = useState<string | null>(null);
  const show = (what: string) => {
    setFlash(what);
    window.setTimeout(() => setFlash(null), 1500);
  };
  return [flash, show] as const;
};

/**
 * The deck's address to share, in the sidebar – as in the portfolio: the
 * link (read-only, copy, open), below it its QR code, to copy as a picture
 * or download as a PNG. The saved address only: an unsaved one leads nowhere
 * yet.
 */
export const ShareField = () => {
  const slug = useFormFields(
    ([fields]) => fields.slug?.initialValue as string | undefined
  );
  const [origin, setOrigin] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [flash, show] = useFlash();
  useEffect(() => setOrigin(window.location.origin), []);
  const url = slug && origin ? `${origin}/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    let on = true;
    // Transparent around the dark squares: it goes on any background.
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#000000ff", light: "#00000000" },
    })
      .then((png) => on && setCode(png))
      .catch(() => undefined);
    return () => {
      on = false;
    };
  }, [url]);

  if (!url) {
    return (
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={muted}>The QR code appears here after the first save.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        paddingBlock: 12,
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="field-type text" style={{ flex: 1, margin: 0 }}>
          <input
            onFocus={(event) => event.target.select()}
            readOnly
            type="text"
            value={url}
          />
        </div>
        <Button
          buttonStyle="subtle"
          className="field-btn"
          margin={false}
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            show("link");
          }}
          size="medium"
          type="button"
        >
          {flash === "link" ? "Copied ✓" : "Copy"}
        </Button>
        <Button
          aria-label="Open the page"
          buttonStyle="subtle"
          className="field-btn"
          el="anchor"
          margin={false}
          newTab
          size="medium"
          tooltip="Open the page"
          url={url}
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </Button>
      </div>
      {code ? (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <img
            alt="QR code"
            src={code}
            style={{
              width: 80,
              height: 80,
              imageRendering: "pixelated",
              // Shown on white – the dark admin would swallow it.
              background: "#ffffff",
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Button
              buttonStyle="subtle"
              className="field-btn"
              margin={false}
              onClick={async () => {
                try {
                  const blob = await (await fetch(code)).blob();
                  await navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]);
                  show("code");
                } catch {
                  show("no-copy");
                }
              }}
              size="medium"
              type="button"
            >
              {flash === "code"
                ? "Copied ✓"
                : flash === "no-copy"
                  ? "Not here ✗"
                  : "Copy as image"}
            </Button>
            <Button
              buttonStyle="subtle"
              className="field-btn"
              margin={false}
              onClick={() => {
                const a = document.createElement("a");
                a.href = code;
                a.download = `${slug}-qr.png`;
                a.click();
              }}
              size="medium"
              type="button"
            >
              Download
            </Button>
          </div>
        </div>
      ) : (
        <p style={muted}>Generating QR…</p>
      )}
    </div>
  );
};
