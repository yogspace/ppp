import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
} from "payload";
import { readArrangement } from "@/features/stickers/arrangement";
import type { Deck } from "@/payload-types";

/**
 * A duplicated deck keeps where its stickers lie. Its slides' rows get new
 * ids in the copy – and the arrangement, keyed by them, can't be written by
 * the form: so before it is made the original is noted, and once it is
 * there each placement goes to the row in the same place.
 */

const KEY = "ppp:duplicateFrom";

/** Each sticker row's id, slide by slide, in order. */
const rowIds = (deck: Partial<Pick<Deck, "slides">>) =>
  (deck.slides ?? []).map((slide) =>
    (slide.stickers ?? []).map((sticker) => sticker.id ?? null)
  );

export const noteDuplicate: CollectionBeforeChangeHook = async ({
  operation,
  originalDoc,
  req,
  data,
}) => {
  // Being duplicated: a create that starts from a copy of an existing deck –
  // its id in the address (`/api/decks/:id/duplicate`), its rows already
  // renumbered here, so the original itself is asked.
  const from = (req as { routeParams?: { id?: unknown } }).routeParams?.id;
  if (
    operation === "create" &&
    originalDoc?.slides &&
    typeof from === "string"
  ) {
    const original = await req.payload.findByID({
      collection: "decks",
      id: from,
      depth: 0,
      req,
      overrideAccess: true,
    });
    req.context[KEY] = {
      rows: rowIds(original),
      arrangement: readArrangement(original.arrangement),
    };
  }
  return data;
};

export const keepArrangement: CollectionAfterChangeHook = async ({
  operation,
  doc,
  req,
}) => {
  const from = req.context[KEY] as
    | {
        rows: (string | null)[][];
        arrangement: ReturnType<typeof readArrangement>;
      }
    | undefined;
  if (operation !== "create" || !from) return doc;
  delete req.context[KEY];
  const rows = rowIds(doc as Deck);
  const arrangement: Record<string, unknown> = {};
  for (const [s, slide] of from.rows.entries()) {
    for (const [r, old] of slide.entries()) {
      const next = rows[s]?.[r];
      const placement = old ? from.arrangement[old] : undefined;
      if (next && placement) arrangement[next] = placement;
    }
  }
  if (!Object.keys(arrangement).length) return doc;
  return req.payload.update({
    collection: "decks",
    id: doc.id,
    data: { arrangement },
    depth: 0,
    req,
    overrideAccess: true,
  });
};
