import type { SlideData } from "./types";

/**
 * Where the deck stands: which slide, and how many of its clicks were made
 * (a List with “one click per point” shows a point per click).
 */
export type Pos = { slide: number; step: number };

/**
 * The clicks a slide holds before the next one comes: a List's points one
 * by one, a stacked Gallery's pictures thrown away one by one, a Card
 * opened and folded open.
 */
export const stepsOf = (slide: SlideData) => {
  if (slide.design === "list" && slide.stepwise) return slide.items.length;
  if (slide.design === "gallery" && slide.layout === "stack") {
    return slide.pictures.length;
  }
  // A Card: out of its envelope, then folded open.
  if (slide.design === "card") return 2;
  // A scratch ticket: rubbed free.
  if (slide.design === "scratch") return 1;
  return 0;
};

/** On: the slide's next click, else the next slide – at the end it stays. */
export const forward = (steps: readonly number[], pos: Pos): Pos => {
  if (pos.step < (steps[pos.slide] ?? 0)) {
    return { slide: pos.slide, step: pos.step + 1 };
  }
  if (pos.slide < steps.length - 1) return { slide: pos.slide + 1, step: 0 };
  return pos;
};

/**
 * Back: a click undone, else the slide before – shown whole, as it was
 * left.
 */
export const backward = (steps: readonly number[], pos: Pos): Pos => {
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 };
  if (pos.slide > 0) {
    return { slide: pos.slide - 1, step: steps[pos.slide - 1] ?? 0 };
  }
  return pos;
};

/** Straight to a slide (a dot, Home, End) – at its start. */
export const jump = (steps: readonly number[], slide: number): Pos => ({
  slide: Math.max(0, Math.min(steps.length - 1, Math.round(slide))),
  step: 0,
});

/**
 * A slide's address: the first is the deck's own, `/my-talk`; then
 * `/my-talk/1`, `/my-talk/2` … – counted from 0.
 */
export const slideHref = (slug: string, slide: number) =>
  slide > 0 ? `/${slug}/${slide}` : `/${slug}`;

/**
 * The slide an address's rest names (`[]` for `/my-talk`, `["2"]` for
 * `/my-talk/2`) – null for anything else, or one past the end. `0` is
 * named, but not the address (`exact` false): it goes to the deck's own.
 */
export const slideFromSegments = (
  segments: readonly string[] | undefined,
  count: number
): { slide: number; exact: boolean } | null => {
  if (!segments?.length) return { slide: 0, exact: true };
  if (segments.length > 1 || !/^\d{1,4}$/.test(segments[0])) return null;
  const slide = Number(segments[0]);
  if (slide >= count) return null;
  return { slide, exact: String(slide) === segments[0] && slide > 0 };
};

/** The slide in a path of this deck – null when it names none. */
export const slideFromPath = (path: string, slug: string, count: number) => {
  const prefix = `/${slug}`;
  if (path !== prefix && !path.startsWith(`${prefix}/`)) return null;
  const rest = path.slice(prefix.length).split("/").filter(Boolean);
  return slideFromSegments(rest, count)?.slide ?? null;
};
