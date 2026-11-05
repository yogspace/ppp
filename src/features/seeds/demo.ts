import type { Payload } from "payload";
import sharp from "sharp";
import { TRANSITIONS } from "@/features/transitions/kinds";
import type { Theme } from "@/payload-types";
import { DEMO_CARD, DEMO_DECK, DEMO_TRANSITIONS } from "./definitions";
import { PHOTOS, STICKERS, svg } from "./demo-art";

type Mode = "fill" | "replace";

const local = { overrideAccess: true, depth: 0 } as const;

type ThemeData = Omit<Theme, "id" | "createdAt" | "updatedAt">;

/** The demo's themes, by key – each named “Demo …”. */
const THEMES = {
  marble: {
    name: "Demo Marble",
    bg: "#efeff5",
    text: "#0b1533",
    accent: "#ff5c8a",
    paper: "#fffcf5",
    paperText: "#0b1533",
    font: "grotesk",
    caps: true,
    background: "lines",
    grain: false,
  },
  bubblegum: {
    name: "Demo Bubblegum",
    bg: "#ffd6e7",
    text: "#4a0e2e",
    accent: "#ff4f9a",
    paper: "#fffcf5",
    paperText: "#0b1533",
    font: "rounded",
    caps: false,
    background: "floaties",
    grain: false,
  },
  night: {
    name: "Demo Night",
    bg: "#16152b",
    text: "#fff4e6",
    accent: "#ffb86b",
    paper: "#fff4e6",
    paperText: "#16152b",
    font: "serif",
    caps: false,
    background: "dots",
    grain: true,
  },
  luminous: {
    name: "Demo Luminous",
    bg: "#2a44ff",
    text: "#ffffff",
    accent: "#ff47d0",
    paper: "#fdf8ef",
    paperText: "#0d1033",
    font: "rounded",
    caps: false,
    background: "floaties",
    grain: false,
  },
} satisfies Record<string, ThemeData>;

type Pictures = Record<string, string>;

const fileName = (name: string) =>
  `demo-${name}.${name in PHOTOS ? "jpg" : "png"}`;

const ALL_PICTURES = [...Object.keys(STICKERS), ...Object.keys(PHOTOS)];

/** The picture, drawn: a sticker as PNG, a photo as JPEG. */
const draw = async (name: string) => {
  if (name in STICKERS) {
    return {
      data: await sharp(Buffer.from(svg(STICKERS[name])))
        .png()
        .toBuffer(),
      mimetype: "image/png",
    };
  }
  const inner = PHOTOS[name];
  const [, w, h] = inner.match(/width="(\d+)" height="(\d+)"/) ?? [];
  return {
    data: await sharp(
      Buffer.from(svg(inner, Number(w) || 800, Number(h) || 600))
    )
      .jpeg({ quality: 88 })
      .toBuffer(),
    mimetype: "image/jpeg",
  };
};

/** A rich text of plain paragraphs. */
const rich = (...paragraphs: string[]) => ({
  root: {
    type: "root",
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: paragraphs.map((text) => ({
      type: "paragraph",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      textFormat: 0,
      children: [
        {
          type: "text",
          text,
          format: 0,
          detail: 0,
          mode: "normal",
          style: "",
          version: 1,
        },
      ],
    })),
  },
});

/** Everything the demo made – gone, for a fresh one. */
const clear = async (payload: Payload) => {
  await payload.delete({
    collection: "decks",
    where: { slug: { in: [DEMO_DECK, DEMO_CARD, DEMO_TRANSITIONS] } },
    ...local,
  });
  await payload.delete({
    collection: "themes",
    where: {
      name: { in: [...Object.values(THEMES).map((t) => t.name), PHOTO_THEME] },
    },
    ...local,
  });
  await payload.delete({
    collection: "media",
    where: { filename: { in: Object.keys(PHOTOS).map(fileName) } },
    ...local,
  });
  await payload.delete({
    collection: "stickers",
    where: { filename: { in: Object.keys(STICKERS).map(fileName) } },
    ...local,
  });
};

/**
 * The demo's pictures – the stickers into the sticker library, the photos
 * into Pictures; those already there (by file name) kept, the rest drawn.
 */
const pictures = async (payload: Payload) => {
  const ids: Pictures = {};
  let made = 0;
  for (const name of ALL_PICTURES) {
    const collection = name in STICKERS ? "stickers" : "media";
    const filename = fileName(name);
    const { docs } = await payload.find({
      collection,
      where: { filename: { equals: filename } },
      limit: 1,
      ...local,
    });
    if (docs[0]) {
      ids[name] = docs[0].id;
      continue;
    }
    const { data, mimetype } = await draw(name);
    const file = { data, mimetype, name: filename, size: data.length };
    const doc =
      collection === "stickers"
        ? await payload.create({
            collection: "stickers",
            data: { name },
            file,
            ...local,
          })
        : await payload.create({
            collection: "media",
            data: { alt: `A ${name}` },
            file,
            ...local,
          });
    ids[name] = doc.id;
    made++;
  }
  return { ids, made };
};

const PHOTO_THEME = "Demo Photo";

/**
 * The demo's themes – those already there by name, the rest made; one of
 * them on a photo (`photo`, a picture's id).
 */
const themes = async (payload: Payload, photo: string) => {
  const ids = {} as Record<keyof typeof THEMES | "photo", string>;
  let made = 0;
  for (const [key, data] of Object.entries(THEMES)) {
    const { docs } = await payload.find({
      collection: "themes",
      where: { name: { equals: data.name } },
      limit: 1,
      ...local,
    });
    ids[key as keyof typeof THEMES] =
      docs[0]?.id ??
      (await payload.create({ collection: "themes", data, ...local })).id;
    if (!docs[0]) made++;
  }
  const { docs } = await payload.find({
    collection: "themes",
    where: { name: { equals: PHOTO_THEME } },
    limit: 1,
    ...local,
  });
  ids.photo =
    docs[0]?.id ??
    (
      await payload.create({
        collection: "themes",
        data: {
          name: PHOTO_THEME,
          bg: "#4a55a2",
          text: "#ffffff",
          accent: "#ffd166",
          paper: "#fffcf5",
          paperText: "#0b1533",
          font: "rounded",
          caps: false,
          background: "picture",
          picture: photo,
          grain: true,
        },
        ...local,
      })
    ).id;
  if (!docs[0]) made++;
  return { ids, made };
};

const exists = async (payload: Payload, slug: string) =>
  (
    await payload.count({
      collection: "decks",
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  ).totalDocs > 0;

/**
 * The demo: the deck /hello – every design –, /transitions – every
 * transition once, in order – and the card /for-you (a deck of one Card
 * slide), with the stickers, photos and themes they show. Fill adds what is missing; replace
 * makes it all anew.
 */
export const seedDemo = async (payload: Payload, mode: Mode) => {
  if (mode === "replace") await clear(payload);
  const deckThere = await exists(payload, DEMO_DECK);
  const cardThere = await exists(payload, DEMO_CARD);
  const transitionsThere = await exists(payload, DEMO_TRANSITIONS);
  if (deckThere && cardThere && transitionsThere) {
    return `/${DEMO_DECK}, /${DEMO_TRANSITIONS} and /${DEMO_CARD} are there already – nothing added.`;
  }

  const media = await pictures(payload);
  const themed = await themes(payload, media.ids.sunset);
  const look = themed.ids;
  const m = media.ids;
  const stickers = (...names: string[]) =>
    names.map((name) => ({ sticker: m[name] }));

  if (!deckThere) {
    await payload.create({
      collection: "decks",
      ...local,
      data: {
        title: "Hello, ppp",
        slug: DEMO_DECK,
        theme: look.marble,
        transition: "swipe",
        slides: [
          {
            blockType: "poster",
            text: "More\nmarble-\ncake\nplease",
            align: "stairs",
            stickers: stickers("star", "heart", "icecream", "planet"),
          },
          {
            blockType: "cover",
            kicker: "a tiny talk",
            title: "Pretty little\npresentations",
            subtitle: "Slides that fly in, stickers you can throw around.",
            theme: look.bubblegum,
            transition: "boing",
            stickers: stickers("rainbow", "ghost"),
          },
          {
            blockType: "list",
            heading: "Things that matter",
            items: [
              "Cake",
              "Naps",
              "Stickers, obviously",
              "A good transition",
            ].map((text) => ({ text })),
            stepwise: true,
            transition: "checkerboard",
            stickers: stickers("icecream"),
          },
          {
            blockType: "words",
            heading: "Why ppp?",
            body: rich(
              "Because slides can be cute. Every slide picks a design, a theme and how it comes in – from a calm swipe to the finest PowerPoint 2003 star wipe.",
              "Stickers are PNGs: they get a white die-cut edge and turn into glossy 3D vinyl."
            ),
            theme: look.night,
            transition: "star",
          },
          {
            blockType: "quote",
            quote: "I have never seen a slide this happy.",
            author: "Everyone, probably",
            theme: look.luminous,
            transition: "curtain",
            stickers: stickers("star", "heart"),
          },
          {
            blockType: "picture",
            image: m.sea,
            caption: "A very small boat",
            fit: "framed",
            transition: "toss",
          },
          {
            blockType: "split",
            heading: "Words + picture",
            body: rich(
              "A few words on one side, a picture on the other – on a phone held upright, one above the other.",
              "This slide's theme sits on a photo, with a little grain."
            ),
            image: m.hills,
            side: "right",
            theme: look.photo,
            transition: "zoom",
          },
          {
            blockType: "gallery",
            heading: "Summer, roughly",
            body: rich(
              "A sunset, some hills, a night and a very small boat. Tap a picture to bring it up close."
            ),
            pictures: [
              { image: m.sunset, caption: "the sunset" },
              { image: m.hills, caption: "hills!" },
              { image: m.night, caption: "late" },
              { image: m.sea, caption: "boat" },
            ],
            transition: "pop",
            stickers: stickers("heart"),
          },
          {
            blockType: "gallery",
            layout: "stack",
            heading: "Throw them away",
            body: rich(
              "One after another, left and right – and after the last one, these words."
            ),
            pictures: [
              { image: m.night, caption: "late" },
              { image: m.sea, caption: "boat" },
              { image: m.hills, caption: "hills!" },
              { image: m.sunset, caption: "the sunset" },
            ],
            theme: look.night,
            transition: "flip",
          },
          {
            blockType: "blank",
            theme: look.bubblegum,
            transition: "confetti",
            stickers: stickers(
              "star",
              "heart",
              "rainbow",
              "planet",
              "icecream",
              "ghost"
            ),
          },
          {
            blockType: "scratch",
            heading: "Feeling lucky?",
            kicker: "Grand prize",
            prize: "A slide\nall your own",
            footnote: "Rub it with a finger – or just tap next.",
            theme: look.marble,
            transition: "pop",
            stickers: stickers("star", "rainbow"),
          },
          {
            blockType: "link",
            heading: "One more thing",
            url: "https://ppp.mxwr.de/for-you",
            title: "A card, just for you",
            note: "Opens in a new tab. Or scan it from the big screen.",
            label: "Open it",
            theme: look.bubblegum,
            transition: "boing",
            stickers: stickers("rainbow"),
          },
          {
            blockType: "card",
            to: "you",
            headline: "Thank\nyou!",
            message:
              "Thanks for clicking through. A card is a slide too – this one even folds open. And words can hide: ||rub me free||.",
            from: "ppp",
            theme: look.luminous,
            transition: "blob",
            stickers: stickers("heart", "star"),
          },
          {
            blockType: "poster",
            text: "The\nend",
            align: "center",
            theme: look.night,
            transition: "spinner",
            stickers: stickers("ghost"),
          },
        ],
      },
    });
  }

  if (!cardThere) {
    await payload.create({
      collection: "decks",
      ...local,
      data: {
        title: "A card for Anna",
        slug: DEMO_CARD,
        theme: look.bubblegum,
        transition: "fade",
        slides: [
          {
            blockType: "card",
            to: "Anna",
            headline: "You\nare\ngreat",
            message:
              "Just wanted to say: you're doing great. Have some cake, a nap, and a sticker or two.\n\nLots of love",
            from: "Max",
            stickers: stickers("heart", "star", "icecream"),
          },
        ],
      },
    });
  }

  if (!transitionsThere) {
    const looks = [
      look.marble,
      look.bubblegum,
      look.night,
      look.luminous,
      look.photo,
    ];
    const art = ["star", "heart", "rainbow", "planet", "icecream", "ghost"];
    const kinds = Object.entries(TRANSITIONS) as [
      keyof typeof TRANSITIONS,
      string,
    ][];
    await payload.create({
      collection: "decks",
      ...local,
      data: {
        title: "Every transition",
        slug: DEMO_TRANSITIONS,
        theme: look.marble,
        transition: "fade",
        slides: kinds.map(([kind, label], i) => {
          const [name, about] = label.split(" – ");
          return {
            blockType: "cover" as const,
            kicker: `${i + 1} of ${kinds.length}`,
            title: name.replace("💾 ", "").replace("🎲 ", ""),
            subtitle: about
              ? `${name.startsWith("💾") ? "PowerPoint 2003: " : ""}${about}`
              : name.startsWith("💾")
                ? "PowerPoint 2003"
                : "",
            theme: looks[i % looks.length],
            transition: kind,
            stickers: stickers(art[i % art.length]),
          };
        }),
      },
    });
  }

  return [
    `deck /${DEMO_DECK} ${deckThere ? "kept" : "made"}`,
    `deck /${DEMO_TRANSITIONS} ${transitionsThere ? "kept" : "made"}`,
    `card /${DEMO_CARD} ${cardThere ? "kept" : "made"}`,
    `${media.made} of ${ALL_PICTURES.length} pictures drawn`,
    `${themed.made} of ${Object.keys(THEMES).length + 1} themes made`,
  ].join(" · ");
};
