// Client-safe: the admin page imports this – no seed code may come in here.

/**
 * The seeds: what the code brings along for the CMS. They run from their own
 * admin page (view.tsx), not at start or deploy. “Fill” only adds what is
 * missing; “Replace” – behind a confirmation – sets it back to the code's
 * version.
 */
export const SEEDS = ["demo"] as const;

export type SeedKey = (typeof SEEDS)[number];

export const isSeedKey = (value: unknown): value is SeedKey =>
  SEEDS.includes(value as SeedKey);

/** Seeds that can also reset what is there, behind a confirmation. */
export const seedCanReplace: Record<SeedKey, boolean> = {
  demo: true,
};

/** The page's path in the admin. */
export const SEEDS_PATH = "/seeds";

/** The demo's addresses. */
export const DEMO_DECK = "hello";
export const DEMO_CARD = "for-you";
export const DEMO_TRANSITIONS = "transitions";

export type SeedResponse = {
  summary?: string;
  error?: string;
};

export const SEED_TEXTS: Record<
  SeedKey,
  {
    title: string;
    description: string;
    replaceWarning?: string;
    /** Where to look once it ran. */
    links?: { label: string; href: string }[];
  }
> = {
  demo: {
    title: "Demo",
    description: `A deck with every design (/${DEMO_DECK}), every transition once (/${DEMO_TRANSITIONS}), a card in its envelope – a deck of one Card slide (/${DEMO_CARD}) – the stickers and photos they show (drawn by the code) and five themes – to look at, or to copy from. Fill adds whatever of it is missing.`,
    replaceWarning: `The decks /${DEMO_DECK}, /${DEMO_TRANSITIONS} and /${DEMO_CARD}, the “Demo …” themes and the demo pictures are deleted and made anew. Changes made to them – and stickers arranged on them – are lost. Nothing else is touched.`,
    links: [
      { label: "The deck", href: `/${DEMO_DECK}` },
      { label: "The transitions", href: `/${DEMO_TRANSITIONS}` },
      { label: "The card", href: `/${DEMO_CARD}` },
    ],
  },
};
