import type { CollectionConfig } from "payload";
import { admins, anyone } from "@/access";
import { fillSlug, slugField } from "@/features/slug/field";
import { arrangeEndpoint, arrangementField } from "@/features/stickers/fields";
import {
  DEFAULT_TRANSITION,
  transitionOptions,
} from "@/features/transitions/kinds";
import { serverUrl } from "@/lib/server-url";
import type { Deck } from "@/payload-types";
import { DESIGNS } from "./designs";

/** Every sticker's row id in a deck – what may be arranged. */
export const deckStickerIds = (deck: Pick<Deck, "slides">) =>
  new Set(
    (deck.slides ?? []).flatMap((slide) =>
      (slide.stickers ?? []).flatMap((sticker) =>
        sticker.id ? [sticker.id] : []
      )
    )
  );

const address = (slug: unknown) =>
  typeof slug === "string" && slug ? `${serverUrl()}/${slug}` : null;

/**
 * Slides to present, at ppp.mxwr.de/<slug>: each slide one of the designs
 * (designs.ts), in the deck's theme or its own.
 */
export const Decks: CollectionConfig = {
  slug: "decks",
  labels: { singular: "Deck", plural: "Decks" },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    group: "Content",
    useAsTitle: "title",
    listSearchableFields: ["title", "slug"],
    defaultColumns: ["title", "slug", "updatedAt"],
    description:
      "Slides to present – or a single Card slide to send. On the page: the slide's own button or → goes on, ← back, H shows the controls, F full screen, E arranges the stickers.",
    preview: (doc) => address(doc?.slug),
    livePreview: { url: ({ data }) => address(data?.slug) ?? serverUrl() },
  },
  hooks: { beforeValidate: [fillSlug] },
  endpoints: [arrangeEndpoint<Deck>("decks", deckStickerIds)],
  fields: [
    { name: "title", type: "text", required: true },
    slugField(),
    // A QR code of the address, the link to copy, the code to download.
    {
      name: "share",
      type: "ui",
      admin: {
        position: "sidebar",
        components: { Field: "@/features/decks/share-field#ShareField" },
      },
    },
    {
      name: "theme",
      type: "relationship",
      relationTo: "themes",
      label: "Default theme",
      admin: {
        position: "sidebar",
        description: "Every slide's – a slide may pick its own (tab Look).",
      },
    },
    {
      name: "transition",
      type: "select",
      label: "Default transition",
      required: true,
      defaultValue: DEFAULT_TRANSITION,
      options: transitionOptions(),
      admin: {
        position: "sidebar",
        description: "How every slide comes in – a slide may pick its own.",
      },
    },
    {
      name: "dock",
      type: "checkbox",
      label: "Dock",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description:
          "The controls at the bottom (dots, full screen, arranging) – shown with the mouse at the bottom edge, H or a long press. Off: only the slides' own buttons.",
      },
    },
    {
      name: "slides",
      type: "blocks",
      required: true,
      minRows: 1,
      labels: { singular: "Slide", plural: "Slides" },
      blocks: DESIGNS,
    },
    arrangementField(),
  ],
};
