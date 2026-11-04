import type { CollectionConfig, TextField } from "payload";
import { admins, anyone } from "@/access";
import { BACKGROUNDS, DEFAULT_LOOK, FONTS, isHex } from "./theme";

const color = (
  name: string,
  label: string,
  defaultValue: string,
  description?: string
): TextField => ({
  name,
  type: "text",
  label,
  required: true,
  defaultValue,
  validate: (value?: string | null) =>
    isHex(value) || "A hex color, like #ff5c8a.",
  admin: {
    description,
    components: { Field: "@/features/themes/color-field#ColorField" },
  },
});

/**
 * Color schemes and backgrounds, like the portfolio's themes: made once,
 * picked by a deck (for all its slides), a single slide or a card.
 */
export const Themes: CollectionConfig = {
  slug: "themes",
  labels: { singular: "Theme", plural: "Themes" },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  admin: {
    group: "Look",
    useAsTitle: "name",
    defaultColumns: ["name", "background", "font", "updatedAt"],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      type: "row",
      fields: [
        color("bg", "Background", DEFAULT_LOOK.bg),
        color("text", "Text", DEFAULT_LOOK.text),
        color(
          "accent",
          "Accent",
          DEFAULT_LOOK.accent,
          "Bullets, quote marks, the floaties, the speech bubble."
        ),
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "font",
          type: "select",
          required: true,
          defaultValue: DEFAULT_LOOK.font,
          options: Object.entries(FONTS).map(([value, { label }]) => ({
            value,
            label,
          })),
        },
        {
          name: "caps",
          type: "checkbox",
          label: "Headlines in capitals",
          defaultValue: DEFAULT_LOOK.caps,
        },
      ],
    },
    {
      name: "background",
      type: "radio",
      required: true,
      defaultValue: DEFAULT_LOOK.background,
      options: Object.entries(BACKGROUNDS).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      name: "picture",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        condition: (_, siblings) => siblings?.background === "picture",
        description:
          "Covers the whole screen. A video plays muted, on a loop. Pick text colors that read on it.",
      },
    },
    {
      name: "grain",
      type: "checkbox",
      label: "Grain",
      defaultValue: false,
      admin: { description: "A fine film grain over everything." },
    },
    {
      type: "collapsible",
      label: "On cards",
      admin: { initCollapsed: true },
      fields: [
        {
          type: "row",
          fields: [
            color(
              "paper",
              "Card",
              DEFAULT_LOOK.paper,
              "The card's paper – the page around it takes the background."
            ),
            color("paperText", "Card text", DEFAULT_LOOK.paperText),
          ],
        },
      ],
    },
  ],
};
