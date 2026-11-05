"use client";

import {
  useDocumentInfo,
  useField,
  useForm,
  useFormFields,
} from "@payloadcms/ui";
import { type CSSProperties, useState } from "react";
import { DESIGN_LABELS, type DesignSlug } from "./design-labels";

/** A still of a 1280 × 720 slide, shrunk to this width (px). */
const WIDTH = 176;
const SCALE = WIDTH / 1280;

const styles = {
  strip: {
    listStyle: "none",
    margin: 0,
    display: "flex",
    gap: 12,
    overflowX: "auto",
    padding: "4px 2px 14px",
    marginBottom: "1.5rem",
    scrollSnapType: "x proximity",
  },
  item: {
    flex: "none",
    width: WIDTH,
    cursor: "grab",
    scrollSnapAlign: "start",
    transition: "translate 0.2s ease, opacity 0.2s ease",
  },
  button: {
    all: "unset",
    display: "block",
    cursor: "inherit",
    width: "100%",
  },
  thumb: {
    position: "relative",
    width: WIDTH,
    height: WIDTH * (9 / 16),
    borderRadius: 8,
    overflow: "hidden",
    background: "var(--theme-elevation-100)",
    boxShadow: "0 0.25rem 0.75rem -0.35rem rgb(0 0 0 / 0.45)",
    outlineOffset: 2,
  },
  frame: {
    width: 1280,
    height: 720,
    border: 0,
    transform: `scale(${SCALE})`,
    transformOrigin: "0 0",
    pointerEvents: "none",
  },
  empty: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontSize: 12,
    color: "var(--theme-elevation-500)",
    textAlign: "center",
    padding: 8,
  },
  label: {
    display: "flex",
    gap: 6,
    marginTop: 6,
    fontSize: 12,
    color: "var(--theme-elevation-600)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  number: {
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    color: "var(--theme-elevation-800)",
  },
} satisfies Record<string, CSSProperties>;

/**
 * Above the slides: every slide as a little picture, as it shows when played
 * through (the page itself, `?still`). A click opens that slide below; drag
 * one onto another to move it there. The pictures are of the saved deck –
 * after saving they show the new state.
 */
export const SlideStrip = () => {
  const { rows = [] } = useField({ path: "slides" });
  const { moveFieldRow, dispatchFields, setModified } = useForm();
  const slug = useFormFields(
    ([fields]) => fields.slug?.initialValue as string | undefined
  );
  const { savedDocumentData } = useDocumentInfo();
  const saved = (savedDocumentData?.slides ?? []) as { id?: string }[];
  const savedAt = new Map(saved.map((slide, i) => [slide.id, i]));
  const version = String(savedDocumentData?.updatedAt ?? "");
  const [dragged, setDragged] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  if (!rows.length) return null;

  const open = (index: number) => {
    const id = rows[index]?.id;
    dispatchFields({
      type: "SET_ROW_COLLAPSED",
      path: "slides",
      updatedRows: rows.map((row) =>
        row.id === id ? { ...row, collapsed: false } : row
      ),
    });
    // Once open: scrolled to.
    window.setTimeout(() => {
      document
        .getElementById(`slides-row-${index}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const drop = (to: number) => {
    if (dragged === null || dragged === to) return;
    moveFieldRow({ moveFromIndex: dragged, moveToIndex: to, path: "slides" });
    setModified(true);
  };

  return (
    <ol aria-label="Slides at a glance" style={styles.strip}>
      {rows.map((row, i) => {
        const at = savedAt.get(row.id);
        const label =
          DESIGN_LABELS[row.blockType as DesignSlug]?.label ?? "Slide";
        return (
          <li
            draggable
            key={row.id}
            onDragEnd={() => {
              setDragged(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (over !== i) setOver(i);
            }}
            onDragStart={(event) => {
              setDragged(i);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              drop(i);
              setDragged(null);
              setOver(null);
            }}
            style={{
              ...styles.item,
              opacity: dragged === i ? 0.4 : 1,
              translate: over === i && dragged !== i ? "0 -4px" : "0 0",
            }}
            title={`Slide ${i + 1} – click to open, drag to move`}
          >
            <button onClick={() => open(i)} style={styles.button} type="button">
              <div
                style={{
                  ...styles.thumb,
                  outline:
                    over === i && dragged !== i
                      ? "2px solid var(--theme-success-500)"
                      : "none",
                }}
              >
                {slug && at !== undefined ? (
                  <iframe
                    loading="lazy"
                    src={`/${slug}/${at}?still&v=${encodeURIComponent(version)}`}
                    style={styles.frame}
                    tabIndex={-1}
                    title={`Slide ${i + 1}`}
                  />
                ) : (
                  <span style={styles.empty}>Save to see it</span>
                )}
              </div>
              <div style={styles.label}>
                <span style={styles.number}>{i === 0 ? "/" : `/${i}`}</span>
                <span>{label}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
};
