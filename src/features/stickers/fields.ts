import type { ArrayField, Endpoint, JSONField } from "payload";
import { arrange, readArrangeRequest } from "./arrangement";

/**
 * A slide's stickers: which from the library (Stickers), in which order –
 * the same one as often as wanted, each row a sticker of its own with its
 * own place.
 */
export const stickersField = (): ArrayField => ({
  name: "stickers",
  type: "array",
  labels: { singular: "Sticker", plural: "Stickers" },
  admin: {
    description:
      "From the sticker library. Each gets a white die-cut edge and turns 3D. Arrange them on the page: open it logged in and press E.",
    components: { RowLabel: "@/features/stickers/row-label#StickerRowLabel" },
  },
  fields: [
    {
      name: "sticker",
      type: "upload",
      relationTo: "stickers",
      required: true,
    },
  ],
});

/**
 * Where the stickers sit (stickers/arrangement.ts) – written only by the
 * arrange endpoint, never by the admin's form, and not shown there.
 */
export const arrangementField = (): JSONField => ({
  name: "arrangement",
  type: "json",
  access: { create: () => false, update: () => false },
  admin: { hidden: true },
});

/**
 * `POST /api/decks/:id/arrange` – `{ sticker, placement, shape }` from the
 * page: one sticker moved on a wide or a tall stage (or, with
 * `placement: null`, put back there). Admins only;
 * Payload checks the request's origin for the login cookie.
 */
export const arrangeEndpoint = <T extends { arrangement?: unknown }>(
  collection: "decks",
  stickerIds: (doc: T) => Set<string>
): Endpoint => ({
  path: "/:id/arrange",
  method: "post",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Log in first." }, { status: 401 });
    }
    const id = String(req.routeParams?.id ?? "");
    const request = readArrangeRequest(await req.json?.().catch(() => null));
    if (!request) {
      return Response.json({ error: "Not a placement." }, { status: 400 });
    }
    const doc = (await req.payload
      .findByID({ collection, id, depth: 0, req, overrideAccess: true })
      .catch(() => null)) as T | null;
    const ids = doc ? stickerIds(doc) : null;
    if (!(doc && ids?.has(request.sticker))) {
      return Response.json({ error: "No such sticker." }, { status: 404 });
    }
    const arrangement = arrange(
      doc.arrangement,
      ids,
      request.sticker,
      request.placement,
      request.shape
    );
    await req.payload.update({
      collection,
      id,
      data: { arrangement },
      depth: 0,
      req,
      overrideAccess: true,
    });
    return Response.json({ ok: true });
  },
});
