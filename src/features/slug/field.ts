import type { CollectionBeforeValidateHook, TextField } from "payload";
import { slugify, slugProblem } from "./slug";

type Addressed = "decks" | "cards";

const OTHER: Record<Addressed, Addressed> = { decks: "cards", cards: "decks" };

/**
 * The slug field: unique in its collection (an index) and not taken by the
 * other one – decks and cards share the addresses.
 */
export const slugField = (collection: Addressed): TextField => ({
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    description:
      "The address: ppp.mxwr.de/<slug>. Made from the title when left empty.",
  },
  validate: async (value, { req }) => {
    if (typeof value !== "string" || !value) return "Needs an address.";
    const problem = slugProblem(value);
    if (problem) return problem;
    const { totalDocs } = await req.payload.count({
      collection: OTHER[collection],
      where: { slug: { equals: value } },
      overrideAccess: true,
      req,
    });
    return totalDocs > 0
      ? `“${value}” is already a ${collection === "decks" ? "card" : "deck"}.`
      : true;
  },
});

/** An empty slug from the title. */
export const fillSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.title === "string") {
    data.slug = slugify(data.title);
  }
  return data;
};
