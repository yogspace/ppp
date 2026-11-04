"use client";

import { useFormFields } from "@payloadcms/ui";
import type { CSSProperties } from "react";
import { DEFAULT_LOOK, FONTS, type Font, isHex } from "./theme";

const color = (value: unknown, fallback: string) =>
  isHex(value) ? value : fallback;

/**
 * The theme as it looks, live while it is edited: a little slide in its
 * colors and font, on its background, and a card on its paper.
 */
export const ThemePreview = () => {
  const values = useFormFields(([fields]) => ({
    bg: fields.bg?.value,
    text: fields.text?.value,
    accent: fields.accent?.value,
    paper: fields.paper?.value,
    paperText: fields.paperText?.value,
    font: fields.font?.value,
    caps: fields.caps?.value,
    background: fields.background?.value,
    grain: fields.grain?.value,
  }));
  const bg = color(values.bg, DEFAULT_LOOK.bg);
  const ink = color(values.text, DEFAULT_LOOK.text);
  const accent = color(values.accent, DEFAULT_LOOK.accent);
  const paper = color(values.paper, DEFAULT_LOOK.paper);
  const paperInk = color(values.paperText, DEFAULT_LOOK.paperText);
  const font =
    FONTS[(values.font as Font) in FONTS ? (values.font as Font) : "grotesk"];
  const caps = values.caps !== false;
  const line = `color-mix(in oklab, ${ink} 18%, transparent)`;

  const backgrounds: Record<string, CSSProperties> = {
    lines: {
      backgroundImage: `linear-gradient(${line}, ${line}), linear-gradient(${line}, ${line}), linear-gradient(${line}, ${line})`,
      backgroundSize: "1px 100%, 1px 100%, 100% 1px",
      backgroundPosition: "4% 0, 96% 0, 0 12%",
      backgroundRepeat: "no-repeat",
    },
    dots: {
      backgroundImage: `radial-gradient(${line} 1px, transparent 1.4px)`,
      backgroundSize: "10px 10px",
    },
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p
        style={{
          margin: "0 0 0.5rem",
          fontSize: "0.8rem",
          color: "var(--theme-elevation-600)",
        }}
      >
        Preview
      </p>
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          borderRadius: "var(--style-radius-m)",
          border: "1px solid var(--theme-elevation-100)",
          background: bg,
          color: ink,
          ...backgrounds[String(values.background)],
        }}
      >
        {values.background === "floaties" &&
          [
            [12, 18, 18],
            [82, 22, 14],
            [88, 76, 20],
            [8, 80, 12],
          ].map(([x, y, size]) => (
            <i
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #fff8, ${accent} 55%)`,
              }}
            />
          ))}
        {values.background === "picture" && (
          <span
            style={{
              position: "absolute",
              right: 8,
              bottom: 6,
              fontSize: 10,
              opacity: 0.6,
            }}
          >
            picture behind
          </span>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            justifyItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: 9,
              background: accent,
              color: "#fff",
              fontFamily: font.family,
            }}
          >
            accent
          </span>
          <span
            style={{
              fontFamily: font.family,
              fontSize: 34,
              lineHeight: 0.9,
              fontWeight:
                values.font === "serif"
                  ? 400
                  : values.font === "rounded"
                    ? 700
                    : 500,
              letterSpacing: values.font === "grotesk" ? "-0.045em" : "-0.02em",
              textTransform: caps ? "uppercase" : "none",
            }}
          >
            Hello!
          </span>
        </div>
      </div>
      <div
        style={{
          marginTop: "0.6rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.9rem",
          borderRadius: "var(--style-radius-m)",
          background: bg,
        }}
      >
        <div
          style={{
            width: "70%",
            aspectRatio: "4 / 3",
            borderRadius: 8,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            background: paper,
            color: paperInk,
            fontFamily: font.family,
            boxShadow: "0 6px 14px -8px rgb(0 0 0 / 0.5)",
            transform: "rotate(-2deg)",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>Dear you,</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>
            on the card's paper
          </span>
        </div>
      </div>
    </div>
  );
};
