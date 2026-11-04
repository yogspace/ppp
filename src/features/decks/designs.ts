import type { Block, Field, Tab } from "payload";
import { stickersField } from "@/features/stickers/fields";
import { transitionOptions } from "@/features/transitions/kinds";
import { editor } from "@/lib/editor";
import { DESIGN_LABELS, type DesignSlug } from "./design-labels";

/**
 * The slides' designs – each a block. A design decides the layout and how
 * its things fly in; every one also takes stickers and, if it likes, a
 * theme of its own. Their pictures in the admin's picker:
 * public/designs/<slug>.svg.
 */

const LOOK: Tab = {
  label: "Look",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "theme",
          type: "relationship",
          relationTo: "themes",
          label: "Own theme",
          admin: {
            width: "50%",
            placeholder: "Like the deck",
            description: "Only this slide's. Empty: the deck's default.",
          },
        },
        {
          name: "transition",
          type: "select",
          label: "Own transition",
          options: transitionOptions(),
          admin: {
            width: "50%",
            placeholder: "Like the deck",
            description:
              "How this slide comes in. Empty: the deck's default. 💾 PowerPoint 2003.",
          },
        },
      ],
    },
  ],
};

/** Array rows named by their words (admin/row-label.tsx). */
const NAMED_ROWS = {
  components: { RowLabel: "@/features/admin/row-label#TextRowLabel" },
} as const;

const STICKERS: Tab = { label: "Stickers", fields: [stickersField()] };

const design = (slug: DesignSlug, about: string, content: Field[]): Block => ({
  slug,
  labels: {
    singular: DESIGN_LABELS[slug].label,
    plural: DESIGN_LABELS[slug].label,
  },
  imageURL: `/designs/${slug}.svg`,
  imageAltText: about,
  admin: {
    // Named by their design and words instead (slide-label.tsx).
    disableBlockName: true,
    group: DESIGN_LABELS[slug].group,
    components: { Label: "@/features/decks/slide-label#SlideLabel" },
  },
  fields: [
    {
      type: "tabs",
      tabs: content.length
        ? [{ label: "Content", fields: content }, STICKERS, LOOK]
        : [STICKERS, LOOK],
    },
  ],
});

/** A picture – or a video, which plays muted, on a loop, like a moving photo. */
const picture = (
  description = "A picture or a video (plays muted, on a loop)."
): Field => ({
  name: "image",
  type: "upload",
  relationTo: "media",
  required: true,
  admin: { description },
});

export const DESIGNS: Block[] = [
  design("poster", "Huge words filling the slide, word by word.", [
    {
      name: "text",
      type: "textarea",
      required: true,
      admin: {
        description:
          "Each line stays a line – keep them short. As big as fits.",
        rows: 4,
      },
    },
    {
      name: "align",
      type: "radio",
      defaultValue: "center",
      options: [
        { label: "Center", value: "center" },
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
        { label: "Stairs", value: "stairs" },
      ],
      admin: {
        layout: "horizontal",
        description: "Stairs: the lines step in and out, like a poster.",
      },
    },
  ]),
  design("cover", "A title, with a little line above and below.", [
    {
      name: "kicker",
      type: "text",
      admin: { description: "Small, in a pill above the title." },
    },
    { name: "title", type: "textarea", required: true, admin: { rows: 2 } },
    { name: "subtitle", type: "textarea", admin: { rows: 2 } },
  ]),
  design("words", "A heading and a few sentences.", [
    { name: "heading", type: "text" },
    { name: "body", type: "richText", required: true, editor },
  ]),
  design("list", "A heading and points that fly in.", [
    { name: "heading", type: "text" },
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Point", plural: "Points" },
      admin: NAMED_ROWS,
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "stepwise",
      type: "checkbox",
      label: "One click per point",
      defaultValue: false,
    },
  ]),
  design("picture", "One picture, framed or filling the slide.", [
    picture(),
    { name: "caption", type: "text" },
    {
      name: "fit",
      type: "radio",
      defaultValue: "framed",
      options: [
        { label: "Framed – flies in, a little tilted", value: "framed" },
        { label: "Full – fills the slide", value: "full" },
      ],
    },
  ]),
  design("split", "Words on one side, a picture on the other.", [
    { name: "heading", type: "text" },
    { name: "body", type: "richText", editor },
    picture(),
    {
      name: "side",
      type: "radio",
      defaultValue: "right",
      options: [
        { label: "Picture right", value: "right" },
        { label: "Picture left", value: "left" },
      ],
      admin: { layout: "horizontal" },
    },
  ]),
  design(
    "gallery",
    "A few words and a pile of pictures, flying in one by one.",
    [
      { name: "heading", type: "text" },
      { name: "body", type: "richText", editor },
      {
        name: "pictures",
        type: "array",
        required: true,
        minRows: 1,
        maxRows: 12,
        labels: { singular: "Picture", plural: "Pictures" },
        admin: {
          ...NAMED_ROWS,
          description:
            "They land as polaroids, a little scattered. On the slide a tap brings one up close.",
        },
        fields: [picture(), { name: "caption", type: "text" }],
      },
      {
        name: "layout",
        type: "radio",
        defaultValue: "pile",
        options: [
          {
            label: "Pile – scattered polaroids, a tap brings one up close",
            value: "pile",
          },
          {
            label:
              "Stack – one behind the other, each tap throws the front one away",
            value: "stack",
          },
        ],
      },
      {
        name: "side",
        type: "radio",
        defaultValue: "right",
        options: [
          { label: "Pictures right", value: "right" },
          { label: "Pictures left", value: "left" },
        ],
        admin: { layout: "horizontal" },
      },
    ]
  ),
  design("quote", "Big words in big quote marks.", [
    { name: "quote", type: "textarea", required: true, admin: { rows: 3 } },
    { name: "author", type: "text" },
  ]),
  design(
    "card",
    "A greeting card in its envelope: tap to open, tap to fold it open.",
    [
      {
        type: "collapsible",
        label: "Envelope",
        fields: [
          {
            name: "to",
            type: "text",
            label: "For",
            admin: {
              description:
                "On the envelope – “For Anna” – and inside, “Dear Anna,”.",
            },
          },
          {
            name: "stamp",
            type: "upload",
            relationTo: "media",
            filterOptions: { mimeType: { contains: "image" } },
            admin: {
              description:
                "The postage stamp in the corner. Empty: the first sticker.",
            },
          },
        ],
      },
      {
        type: "collapsible",
        label: "Front",
        fields: [
          {
            name: "headline",
            type: "textarea",
            admin: {
              rows: 3,
              description:
                "Big words on the front, each line a line. The stickers (tab Stickers) lie on it too.",
            },
          },
        ],
      },
      {
        type: "collapsible",
        label: "Inside",
        fields: [
          {
            name: "greeting",
            type: "text",
            admin: {
              description:
                "Inside, big, above the message – “Liebe Anna,”. Empty: “Dear Anna,”.",
            },
          },
          {
            name: "message",
            type: "textarea",
            required: true,
            admin: { rows: 5 },
          },
          {
            name: "from",
            type: "text",
            label: "From",
            admin: { description: "The signature: “Max”." },
          },
        ],
      },
    ]
  ),
  design("blank", "Nothing but the theme and stickers.", []),
];
