"use client";

import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import type { RichBody } from "./types";

/** A link to another deck or card: its address. */
const internalDocToHref = ({
  linkNode,
}: {
  linkNode: { fields: { doc?: { value?: unknown } | null } };
}) => {
  const value = linkNode.fields.doc?.value;
  return value && typeof value === "object" && "slug" in value
    ? `/${String((value as { slug: unknown }).slug)}`
    : "#";
};

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
});

/** A slide's rich text – paragraphs, bold, italic, links. */
export const Rich = ({
  body,
  className,
}: {
  body: RichBody;
  className?: string;
}) => (
  <RichText
    className={className}
    converters={converters}
    data={body}
    disableContainer={false}
  />
);
