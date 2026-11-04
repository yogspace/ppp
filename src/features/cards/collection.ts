import type { CollectionConfig } from "payload";
import { admins, anyone } from "@/access";
import { fillSlug, slugField } from "@/features/slug/field";
import {
  arrangeEndpoint,
  arrangementField,
  stickersField,
} from "@/features/stickers/fields";
import { serverUrl } from "@/lib/server-url";
import type { Card } from "@/payload-types";

/** Every sticker's row id on a card – what may be arranged. */
export const cardStickerIds = (card: Pick<Card, "stickers">) =>
  new Set(
    (card.stickers ?? []).flatMap((sticker) => (sticker.id ? [sticker.id] : []))
  );

const address = (slug: unknown) =>
  typeof slug === "string" && slug ? `${serverUrl()}/${slug}` : null;

/**
 * A greeting card at ppp.mxwr.de/<slug>: it arrives in an envelope – who
 * it is for, a stamp, a postmark – that opens with a tap; the card slides
 * out, big words and stickers to throw around on its front, and folds open
 * to the message.
 */
export const Cards: CollectionConfig = {
  slug: "cards",
  labels: { singular: "Card", plural: "Cards" },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "to", "updatedAt"],
    description:
      "Greeting cards to send. On the page a tap opens the envelope, another the card; logged in, E arranges the stickers.",
    preview: (doc) => address(doc?.slug),
    livePreview: { url: ({ data }) => address(data?.slug) ?? serverUrl() },
  },
  hooks: { beforeValidate: [fillSlug] },
  endpoints: [arrangeEndpoint<Card>("cards", cardStickerIds)],
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: "The browser tab's title, and the address's." },
    },
    slugField("cards"),
    {
      name: "theme",
      type: "relationship",
      relationTo: "themes",
      admin: { position: "sidebar" },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Envelope",
          fields: [
            {
              name: "to",
              type: "text",
              label: "For",
              admin: {
                description:
                  "Written on the envelope – “For Anna” – and inside, “Dear Anna,”.",
              },
            },
            {
              name: "stamp",
              type: "upload",
              relationTo: "media",
              filterOptions: { mimeType: { contains: "image" } },
              admin: {
                description:
                  "The postage stamp in the envelope's corner. Empty: the first sticker.",
              },
            },
          ],
        },
        {
          label: "Front",
          fields: [
            {
              name: "headline",
              type: "textarea",
              admin: {
                rows: 3,
                description:
                  "Big words on the front – each line stays a line. As big as fits.",
              },
            },
            stickersField(),
          ],
        },
        {
          label: "Inside",
          fields: [
            {
              name: "message",
              type: "textarea",
              required: true,
              admin: {
                rows: 5,
                description: "Inside – the card folds open with a tap.",
              },
            },
            {
              name: "from",
              type: "text",
              label: "From",
              admin: { description: "The signature: “Max”." },
            },
          ],
        },
      ],
    },
    arrangementField(),
  ],
};
