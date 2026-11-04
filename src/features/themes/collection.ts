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
    group: "Library",
    useAsTitle: "name",
    defaultColumns: ["name", "background", "font", "updatedAt"],
    description:
      "Color schemes, fonts and backgrounds – picked by a deck, a slide or a card.",
  },
  fields: [
    { name: "name", type: "text", required: true },
    // How it looks, live, beside the fields.
    {
      name: "preview",
      type: "ui",
      admin: {
        position: "sidebar",
        components: { Field: "@/features/themes/theme-preview#ThemePreview" },
      },
    },
    {
      type: "collapsible",
      label: "Colors",
      fields: [
        {
          type: "row",
          fields: [
            color("bg", "Background", DEFAULT_LOOK.bg),
            color("text", "Text", DEFAULT_LOOK.text),
            color(
              "accent",
              "Accent",
              DEFAULT_LOOK.accent,
              "Bullets, quote marks, floaties, the seal."
            ),
          ],
        },
        {
          type: "row",
          fields: [
            color(
              "paper",
              "Card paper",
              DEFAULT_LOOK.paper,
              "A card's paper and envelope."
            ),
            color(
              "paperText",
              "Card text",
              DEFAULT_LOOK.paperText,
              "The words on it."
            ),
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Type",
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
          admin: { width: "50%" },
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
      type: "collapsible",
      label: "Background",
      fields: [
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
          label: "Grain – a fine film grain over everything",
          defaultValue: false,
        },
      ],
    },
  ],
};
