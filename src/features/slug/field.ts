import type { CollectionBeforeValidateHook, TextField } from "payload";
import { slugify, slugProblem } from "./slug";

/**
 * A deck's address field: unique (an index), in the admin with a padlock and
 * a way to the page (slug-field.tsx).
 */
export const slugField = (): TextField => ({
  name: "slug",
  type: "text",
  label: "Address",
  required: true,
  unique: true,
  index: true,
  admin: {
    position: "sidebar",
    components: { Field: "@/features/slug/slug-field#SlugField" },
  },
  validate: (value: unknown) => {
    if (typeof value !== "string" || !value) return "Needs an address.";
    return slugProblem(value) ?? true;
  },
  hooks: {
    // Duplicated: the next free address – `talk-copy`, `talk-copy-2` …
    beforeDuplicate: [
      async ({ value, req, collection }) => {
        if (typeof value !== "string" || !collection) return value;
        const base = `${value.replace(/-copy(-\d+)?$/, "")}-copy`;
        for (let n = 1; n < 100; n++) {
          const candidate = n === 1 ? base : `${base}-${n}`;
          const { totalDocs } = await req.payload.count({
            collection: collection.slug as "decks",
            where: { slug: { equals: candidate } },
            req,
          });
          if (totalDocs === 0) return candidate;
        }
        return `${base}-${Date.now()}`;
      },
    ],
  },
});

/** An empty slug from the title. */
export const fillSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.title === "string") {
    data.slug = slugify(data.title);
  }
  return data;
};
