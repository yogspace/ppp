"use client";

import { useRowLabel } from "@payloadcms/ui";
import type { CSSProperties } from "react";
import { DESIGN_LABELS, type DesignSlug } from "./design-labels";

type Row = {
  blockType?: string;
  text?: string;
  title?: string;
  heading?: string;
  quote?: string;
  prize?: string;
  url?: string;
  caption?: string;
  pictures?: unknown[];
  stickers?: unknown[];
};

const styles = {
  row: {
    display: "inline-flex",
    gap: "0.6rem",
    alignItems: "baseline",
    minWidth: 0,
  },
  address: {
    fontFamily: "var(--font-mono, ui-monospace, monospace)",
    fontSize: "0.75rem",
    color: "var(--theme-elevation-500)",
  },
  words: {
    color: "var(--theme-elevation-600)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "36ch",
  },
} satisfies Record<string, CSSProperties>;

/**
 * A slide's row in the admin: its address (`/` for the first, then `/1`,
 * `/2` …), its design and its first words – so a long deck reads like a
 * table of contents.
 */
export const SlideLabel = () => {
  const { data, rowNumber = 0 } = useRowLabel<Row>();
  const design = DESIGN_LABELS[data?.blockType as DesignSlug]?.label ?? "Slide";
  const words = (
    data?.text ||
    data?.title ||
    data?.heading ||
    data?.quote ||
    data?.prize ||
    data?.url ||
    data?.caption ||
    ""
  )
    .replace(/\s+/g, " ")
    .trim();
  const extra =
    data?.blockType === "gallery"
      ? `${data.pictures?.length ?? 0} pictures`
      : data?.blockType === "blank"
        ? `${data.stickers?.length ?? 0} stickers`
        : "";
  return (
    <span style={styles.row}>
      <span style={styles.address}>/{rowNumber > 0 ? rowNumber : ""}</span>
      <strong>{design}</strong>
      {(words || extra) && <span style={styles.words}>{words || extra}</span>}
    </span>
  );
};
