/**
 * Where the stickers sit. A slide's or card's stickers are listed in the
 * admin (which picture); where each one sits, how big and how turned, is
 * arranged on the page itself (logged in, E) and kept apart from the
 * admin's form – a document's `arrangement`, by the sticker's row id. The
 * form can't write it (field access), so saving the form never undoes an
 * arrangement made on the page meanwhile.
 *
 * A sticker without a placement sits in one of the default spots.
 */

/**
 * The sticker's middle (x, y, as a share of its stage's width and height),
 * its width (a share of the stage's width) and its turn (degrees,
 * clockwise).
 */
export type Placement = { x: number; y: number; w: number; r: number };

export type Arrangement = Record<string, Placement>;

/** Default spots, around the middle and over the words – the poster look. */
const SPOTS: readonly [number, number][] = [
  [0.13, 0.26],
  [0.87, 0.32],
  [0.3, 0.56],
  [0.64, 0.78],
  [0.1, 0.8],
  [0.9, 0.78],
  [0.52, 0.14],
  [0.74, 0.5],
  [0.38, 0.88],
  [0.24, 0.1],
];
/** On a card: its corners and edges, keeping clear of the words. */
const EDGES: readonly [number, number][] = [
  [0.1, 0.13],
  [0.9, 0.86],
  [0.9, 0.14],
  [0.1, 0.87],
  [0.5, 0.06],
  [0.5, 0.95],
  [0.04, 0.5],
  [0.96, 0.5],
];

export type Spots = "slide" | "edges";

const TURNS = [-12, 9, -6, 14, 8, -10, 5, -15, 11, -4];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Degrees into (-180, 180]. */
const turn = (degrees: number) => {
  const r = ((((degrees + 180) % 360) + 360) % 360) - 180;
  return r === -180 ? 180 : r;
};

/**
 * The `index`th sticker's default: its spot – over the slide, or along the
 * edges (a card, its words in the middle) – a little turned, as wide as
 * keeps every sticker about the same area (`aspect` = width / height);
 * `size` is a square one's width.
 */
export const defaultPlacement = (
  index: number,
  aspect: number,
  size = 0.15,
  spots: Spots = "slide"
): Placement => {
  const list = spots === "edges" ? EDGES : SPOTS;
  const [x, y] = list[index % list.length];
  // Past the last spot: round again, a little shifted.
  const round = Math.floor(index / list.length);
  const safe = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return {
    x: clamp(x + round * 0.04, 0, 1),
    y: clamp(y + round * 0.05, 0, 1),
    w: clamp(size * Math.sqrt(safe), size * 0.55, size * 2.2),
    r: TURNS[index % TURNS.length],
  };
};

/** A placement within reason: on or just off the stage, never tiny. */
export const clampPlacement = (p: Placement): Placement => ({
  x: clamp(p.x, -0.2, 1.2),
  y: clamp(p.y, -0.2, 1.2),
  w: clamp(p.w, 0.03, 1),
  r: turn(p.r),
});

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** A placement from untrusted data – or null. */
export const readPlacement = (value: unknown): Placement | null => {
  if (!value || typeof value !== "object") return null;
  const { x, y, w, r } = value as Record<string, unknown>;
  if (!(isNumber(x) && isNumber(y) && isNumber(w) && isNumber(r))) return null;
  return clampPlacement({ x, y, w, r });
};

/** Row ids: Payload's ObjectIds, or anything short and plain. */
const ID = /^[\w-]{1,64}$/;

/** A stored arrangement, its broken entries left out. */
export const readArrangement = (value: unknown): Arrangement => {
  const out: Arrangement = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [id, entry] of Object.entries(value)) {
    const placement = ID.test(id) ? readPlacement(entry) : null;
    if (placement) out[id] = placement;
  }
  return out;
};

/**
 * What the page sends when a sticker was moved: its row id and where it
 * sits now – null puts it back on its default spot.
 */
export const readArrangeRequest = (
  body: unknown
): { sticker: string; placement: Placement | null } | null => {
  if (!body || typeof body !== "object") return null;
  const { sticker, placement } = body as Record<string, unknown>;
  if (typeof sticker !== "string" || !ID.test(sticker)) return null;
  if (placement === null) return { sticker, placement: null };
  const read = readPlacement(placement);
  return read ? { sticker, placement: read } : null;
};

/**
 * The arrangement after one sticker moved – only stickers the document
 * still has are kept (`ids`), so removed ones don't linger.
 */
export const arrange = (
  current: unknown,
  ids: ReadonlySet<string>,
  sticker: string,
  placement: Placement | null
): Arrangement => {
  const next: Arrangement = {};
  for (const [id, entry] of Object.entries(readArrangement(current))) {
    if (ids.has(id) && id !== sticker) next[id] = entry;
  }
  if (placement && ids.has(sticker)) next[sticker] = clampPlacement(placement);
  return next;
};
