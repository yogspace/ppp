// Client-safe: the admin's row labels import this – nothing of Payload's
// server side may come in here.

/** The designs' names and their group in the admin's picker. */
export const DESIGN_LABELS = {
  poster: { label: "Big type", group: "Words" },
  cover: { label: "Title", group: "Words" },
  words: { label: "Text", group: "Words" },
  list: { label: "List", group: "Words" },
  quote: { label: "Quote", group: "Words" },
  picture: { label: "Picture", group: "Pictures" },
  split: { label: "Words + picture", group: "Pictures" },
  gallery: { label: "Gallery", group: "Pictures" },
  card: { label: "Card", group: "Other" },
  scratch: { label: "Scratch ticket", group: "Other" },
  blank: { label: "Just stickers", group: "Other" },
} as const;

export type DesignSlug = keyof typeof DESIGN_LABELS;
