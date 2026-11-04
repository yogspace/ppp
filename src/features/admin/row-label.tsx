"use client";

import { useRowLabel } from "@payloadcms/ui";

/**
 * An array row named by its words – a List's point, a Gallery's caption –
 * else by its number.
 */
export const TextRowLabel = () => {
  const { data, rowNumber = 0 } = useRowLabel<{
    text?: string;
    caption?: string;
  }>();
  const words = (data?.text || data?.caption || "").trim();
  return (
    <span>{words || `No. ${String(rowNumber + 1).padStart(2, "0")}`}</span>
  );
};
