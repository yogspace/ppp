import type { Block, Field, Tab } from "payload";
import { stickersField } from "@/features/stickers/fields";
import { transitionOptions } from "@/features/transitions/kinds";
import { editor } from "@/lib/editor";

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
      name: "theme",
      type: "relationship",
      relationTo: "themes",
      admin: { description: "This slide's own theme – empty: the deck's." },
    },
    {
      name: "transition",
      type: "select",
      admin: {
        description:
          "How this slide comes in – empty: the deck's. 💾 ones are PowerPoint 2003.",
      },
      options: transitionOptions(),
    },
  ],
};

const STICKERS: Tab = { label: "Stickers", fields: [stickersField()] };

const design = (
  slug: string,
  label: string,
  about: string,
  content: Field[]
): Block => ({
  slug,
  labels: { singular: label, plural: label },
  imageURL: `/designs/${slug}.svg`,
  imageAltText: about,
  admin: { disableBlockName: false },
  fields: [
    {
      type: "tabs",
      tabs: content.length
        ? [{ label: "Content", fields: content }, STICKERS, LOOK]
        : [STICKERS, LOOK],
    },
  ],
});

const picture = (description?: string): Field => ({
  name: "image",
  type: "upload",
  relationTo: "media",
  required: true,
  filterOptions: { mimeType: { contains: "image" } },
  admin: { description },
});

export const DESIGNS: Block[] = [
  design("poster", "Big type", "Huge words filling the slide, word by word.", [
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
  design("cover", "Title", "A title, with a little line above and below.", [
    {
      name: "kicker",
      type: "text",
      admin: { description: "Small, in a pill above the title." },
    },
    { name: "title", type: "textarea", required: true, admin: { rows: 2 } },
    { name: "subtitle", type: "textarea", admin: { rows: 2 } },
  ]),
  design("words", "Text", "A heading and a few sentences.", [
    { name: "heading", type: "text" },
    { name: "body", type: "richText", required: true, editor },
  ]),
  design("list", "List", "A heading and points that fly in.", [
    { name: "heading", type: "text" },
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Point", plural: "Points" },
      fields: [{ name: "text", type: "text", required: true }],
    },
    {
      name: "stepwise",
      type: "checkbox",
      label: "One click per point",
      defaultValue: false,
    },
  ]),
  design("picture", "Picture", "One picture, framed or filling the slide.", [
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
  design(
    "split",
    "Words + picture",
    "Words on one side, a picture on the other.",
    [
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
    ]
  ),
  design("quote", "Quote", "Big words in big quote marks.", [
    { name: "quote", type: "textarea", required: true, admin: { rows: 3 } },
    { name: "author", type: "text" },
  ]),
  design("blank", "Just stickers", "Nothing but the theme and stickers.", []),
];
