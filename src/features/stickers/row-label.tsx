"use client";

import { useRowLabel } from "@payloadcms/ui";

/** A slide's sticker row: which sticker – its number until one is picked. */
export const StickerRowLabel = () => {
  const { data, rowNumber = 0 } = useRowLabel<{
    sticker?: string | { name?: string } | null;
  }>();
  const name =
    data?.sticker && typeof data.sticker === "object" ? data.sticker.name : "";
  return (
    <span>{name || `Sticker ${String(rowNumber + 1).padStart(2, "0")}`}</span>
  );
};
