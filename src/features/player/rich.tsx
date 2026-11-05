"use client";

import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import { Fragment } from "react";
import { hasSecret, scratchParts } from "@/features/scratch/parse";
import { Scratch } from "@/features/scratch/scratch";
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
  // A secret (`||…||`) in a run of text: under foil, its bold or italic kept.
  text: (args) => {
    const plain = defaultConverters.text;
    if (typeof plain !== "function") return args.node.text;
    if (!hasSecret(args.node.text)) return plain(args);
    return scratchParts(args.node.text).map((part, i) => {
      const shown = plain({ ...args, node: { ...args.node, text: part.text } });
      const key = `${i}-${part.text}`;
      return part.secret ? (
        <Scratch key={key}>{shown}</Scratch>
      ) : (
        <Fragment key={key}>{shown}</Fragment>
      );
    });
  },
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
