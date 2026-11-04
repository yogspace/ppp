import {
  BoldFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  lexicalEditor,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
} from "@payloadcms/richtext-lexical";

/**
 * The one rich text editor: paragraphs with bold, italic, underline,
 * strikethrough and links – what fits on a slide. Headings and lists are
 * the designs' own (a slide's heading, the List design's points).
 */
export const editor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    LinkFeature({ enabledCollections: ["decks"] }),
    InlineToolbarFeature(),
  ],
});
