// `pnpm seed:demo [url]` – a demo to look at: a few stickers (drawn here,
// PNGs with transparent backgrounds), four themes, the deck “hello” with
// every design and some transitions, and the card “for-you”.
//
// Over the REST API, so it works against any ppp – the local one by
// default, or e.g. `pnpm seed:demo https://ppp.mxwr.de`. Logs in with
// PAYLOAD_ADMIN_EMAIL / PAYLOAD_ADMIN_PASSWORD (environment or .env).
// Run again, it replaces what it made before (same slugs, names, files).
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const env = async (key) => {
  if (process.env[key]) return process.env[key];
  const file = await readFile(
    new URL("../.env", import.meta.url),
    "utf8"
  ).catch(() => "");
  return file.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();
};

const email = await env("PAYLOAD_ADMIN_EMAIL");
const password = await env("PAYLOAD_ADMIN_PASSWORD");
if (!(email && password)) {
  console.error("✗ PAYLOAD_ADMIN_EMAIL / PAYLOAD_ADMIN_PASSWORD missing.");
  process.exit(1);
}

const login = await fetch(`${base}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!login.ok) {
  console.error(`✗ Login failed (${login.status}).`);
  process.exit(1);
}
const { token } = await login.json();
const auth = { Authorization: `JWT ${token}` };

const api = async (path, init = {}) => {
  const response = await fetch(`${base}/api${path}`, {
    ...init,
    headers: { ...auth, ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${path}: ${response.status} ${JSON.stringify(body.errors ?? body)}`
    );
  }
  return body;
};

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/** Deletes whatever matches – the demo made before. */
const clear = async (collection, where) => {
  const query = new URLSearchParams({ limit: "100", depth: "0" });
  for (const [key, value] of Object.entries(where)) {
    query.set(`where[${key}]`, value);
  }
  const { docs } = await api(`/${collection}?${query}`);
  for (const doc of docs)
    await api(`/${collection}/${doc.id}`, { method: "DELETE" });
};

// ── Stickers ──────────────────────────────────────────────────────────────
const face = (cx, cy, s = 1) => `
  <circle cx="${cx - 34 * s}" cy="${cy}" r="${12 * s}" fill="#1b1b2f"/>
  <circle cx="${cx + 34 * s}" cy="${cy}" r="${12 * s}" fill="#1b1b2f"/>
  <circle cx="${cx - 30 * s}" cy="${cy - 4 * s}" r="${4 * s}" fill="#fff"/>
  <circle cx="${cx + 38 * s}" cy="${cy - 4 * s}" r="${4 * s}" fill="#fff"/>
  <path d="M${cx - 18 * s} ${cy + 22 * s} q${18 * s} ${20 * s} ${36 * s} 0" stroke="#1b1b2f" stroke-width="${8 * s}" fill="none" stroke-linecap="round"/>
  <ellipse cx="${cx - 62 * s}" cy="${cy + 26 * s}" rx="${16 * s}" ry="${10 * s}" fill="#ff7aa8" opacity="0.7"/>
  <ellipse cx="${cx + 62 * s}" cy="${cy + 26 * s}" rx="${16 * s}" ry="${10 * s}" fill="#ff7aa8" opacity="0.7"/>`;

const star = (() => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 125 : 270;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return `${300 + Math.cos(a) * r},${320 + Math.sin(a) * r}`;
  }).join(" ");
  return `<polygon points="${points}" fill="#ffc31f" stroke="#ff9f1c" stroke-width="18" stroke-linejoin="round"/>${face(300, 330)}`;
})();

const STICKERS = {
  star,
  heart: `<path d="M300 520 C120 400 60 300 90 200 C120 100 250 90 300 190 C350 90 480 100 510 200 C540 300 480 400 300 520Z" fill="#ff4f87"/>
    <path d="M170 190 q30 -50 80 -40" stroke="#fff" stroke-width="22" fill="none" stroke-linecap="round" opacity="0.8"/>${face(300, 300, 0.9)}`,
  rainbow: ["#ff5f6d", "#ffb347", "#ffe66d", "#5fd38d", "#5fa8ff", "#a77bff"]
    .map(
      (c, i) =>
        `<path d="M${60 + i * 34} 420 A${240 - i * 34} ${240 - i * 34} 0 0 1 ${540 - i * 34} 420" stroke="${c}" stroke-width="36" fill="none"/>`
    )
    .join("")
    .concat(
      `<circle cx="95" cy="430" r="62" fill="#fff"/><circle cx="150" cy="445" r="48" fill="#fff"/><circle cx="505" cy="430" r="62" fill="#fff"/><circle cx="450" cy="445" r="48" fill="#fff"/>`
    ),
  planet: `<ellipse cx="300" cy="320" rx="270" ry="70" fill="none" stroke="#ffb3d1" stroke-width="34" transform="rotate(-18 300 320)"/>
    <circle cx="300" cy="300" r="170" fill="#8b5cf6"/>
    <circle cx="240" cy="230" r="36" fill="#a78bfa"/><circle cx="360" cy="370" r="24" fill="#a78bfa"/>
    <path d="M60 380 A270 70 -18 0 0 540 260" stroke="#ffb3d1" stroke-width="34" fill="none" transform="rotate(-18 300 320) rotate(18 300 320)"/>
    ${face(300, 310, 0.8)}`,
  icecream: `<path d="M210 300 L300 560 L390 300Z" fill="#f4b26b"/>
    <path d="M230 330 L370 330 M245 380 L355 380 M262 430 L338 430" stroke="#d98c3f" stroke-width="12"/>
    <circle cx="300" cy="230" r="120" fill="#ff9ecb"/><circle cx="215" cy="290" r="62" fill="#ff9ecb"/><circle cx="385" cy="290" r="62" fill="#ff9ecb"/>
    <rect x="250" y="150" width="14" height="40" rx="7" fill="#5fd38d" transform="rotate(30 257 170)"/>
    <rect x="330" y="170" width="14" height="40" rx="7" fill="#ffe66d" transform="rotate(-40 337 190)"/>
    <rect x="290" y="120" width="14" height="40" rx="7" fill="#5fa8ff" transform="rotate(80 297 140)"/>
    <circle cx="300" cy="100" r="34" fill="#ff4f5e"/>${face(300, 250, 0.75)}`,
  ghost: `<path d="M150 520 V280 A150 150 0 0 1 450 280 V520 l-50 -40 -50 40 -50 -40 -50 40 -50 -40Z" fill="#f2f0ff"/>
    ${face(300, 290, 0.9)}`,
};

// A few “photos” for the gallery – little landscapes, drawn here.
const PHOTOS = {
  sunset: `<rect width="800" height="600" fill="#ffb4a2"/><circle cx="400" cy="360" r="120" fill="#ff6b6b"/><rect y="380" width="800" height="220" fill="#5f6caf"/><path d="M0 420 q100 -20 200 0 t200 0 t200 0 t200 0 V600 H0Z" fill="#4a55a2"/>`,
  hills: `<rect width="800" height="600" fill="#bde0fe"/><circle cx="640" cy="130" r="60" fill="#ffd166"/><path d="M0 420 Q200 260 420 400 T800 360 V600 H0Z" fill="#80ed99"/><path d="M0 500 Q260 380 520 480 T800 460 V600 H0Z" fill="#38b000"/>`,
  night: `<rect width="800" height="600" fill="#22223b"/><circle cx="560" cy="160" r="70" fill="#f2e9e4"/><circle cx="590" cy="140" r="62" fill="#22223b"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 197) % 800}" cy="${(i * 89) % 380}" r="${1 + (i % 3)}" fill="#fff"/>`).join("")}<path d="M0 470 L160 330 L300 450 L470 290 L640 440 L800 360 V600 H0Z" fill="#4a4e69"/>`,
  sea: `<rect width="600" height="800" fill="#caf0f8"/><rect y="420" width="600" height="380" fill="#48cae4"/><path d="M0 460 q75 -25 150 0 t150 0 t150 0 t150 0" stroke="#fff" stroke-width="10" fill="none"/><path d="M220 420 L300 250 L380 420Z" fill="#fff"/><rect x="296" y="250" width="8" height="190" fill="#6d597a"/><rect x="200" y="420" width="200" height="40" rx="18" fill="#e56b6f"/>`,
};

const svg = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">${inner}</svg>`;

console.info("→ Clearing the old demo …");
await clear("decks", { "slug[equals]": "hello" });
await clear("cards", { "slug[equals]": "for-you" });
await clear("media", { "filename[like]": "demo-" });
await clear("themes", { "name[like]": "Demo " });

console.info("→ Stickers …");
const media = {};
for (const [name, inner] of Object.entries(STICKERS)) {
  const png = await sharp(Buffer.from(svg(inner)))
    .png()
    .toBuffer();
  const form = new FormData();
  form.append(
    "file",
    new Blob([png], { type: "image/png" }),
    `demo-${name}.png`
  );
  form.append("_payload", JSON.stringify({ alt: `A ${name}` }));
  media[name] = (await api("/media", { method: "POST", body: form })).doc.id;
}

console.info("→ Photos …");
for (const [name, inner] of Object.entries(PHOTOS)) {
  const [, w, h] = inner.match(/width="(\d+)" height="(\d+)"/) ?? [0, 800, 600];
  const jpg = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${inner}</svg>`
    )
  )
    .jpeg({ quality: 88 })
    .toBuffer();
  const form = new FormData();
  form.append(
    "file",
    new Blob([jpg], { type: "image/jpeg" }),
    `demo-${name}.jpg`
  );
  form.append("_payload", JSON.stringify({ alt: `A ${name}` }));
  media[name] = (await api("/media", { method: "POST", body: form })).doc.id;
}

console.info("→ Themes …");
const theme = async (data) => (await api("/themes", json("POST", data))).doc.id;
const marble = await theme({
  name: "Demo Marble",
  bg: "#efeff5",
  text: "#0b1533",
  accent: "#ff5c8a",
  font: "grotesk",
  caps: true,
  background: "lines",
});
const bubblegum = await theme({
  name: "Demo Bubblegum",
  bg: "#ffd6e7",
  text: "#4a0e2e",
  accent: "#ff4f9a",
  font: "rounded",
  caps: false,
  background: "floaties",
});
const night = await theme({
  name: "Demo Night",
  bg: "#16152b",
  text: "#fff4e6",
  accent: "#ffb86b",
  font: "serif",
  caps: false,
  background: "dots",
  grain: true,
});
const blue = await theme({
  name: "Demo Luminous",
  bg: "#2a44ff",
  text: "#ffffff",
  accent: "#ff47d0",
  font: "rounded",
  caps: false,
  background: "floaties",
  paper: "#fdf8ef",
  paperText: "#0d1033",
});

const rich = (...paragraphs) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
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

const stickers = (...names) => names.map((name) => ({ image: media[name] }));

console.info("→ The deck “hello” …");
await api(
  "/decks",
  json("POST", {
    title: "Hello, ppp",
    slug: "hello",
    theme: marble,
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
        theme: bubblegum,
        transition: "boing",
        stickers: stickers("rainbow", "ghost"),
      },
      {
        blockType: "list",
        heading: "Things that matter",
        items: ["Cake", "Naps", "Stickers, obviously", "A good transition"].map(
          (text) => ({ text })
        ),
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
        theme: night,
        transition: "star",
      },
      {
        blockType: "quote",
        quote: "I have never seen a slide this happy.",
        author: "Everyone, probably",
        theme: blue,
        transition: "curtain",
        stickers: stickers("star", "heart"),
      },
      {
        blockType: "picture",
        image: media.planet,
        caption: "Planet Cute",
        fit: "framed",
        transition: "toss",
      },
      {
        blockType: "gallery",
        heading: "Summer, roughly",
        body: rich(
          "A sunset, some hills, a night and a very small boat. Tap a picture to bring it up close."
        ),
        pictures: [
          { image: media.sunset, caption: "the sunset" },
          { image: media.hills, caption: "hills!" },
          { image: media.night, caption: "late" },
          { image: media.sea, caption: "boat" },
        ],
        transition: "pop",
        stickers: stickers("heart"),
      },
      {
        blockType: "blank",
        theme: bubblegum,
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
        blockType: "poster",
        text: "The\nend",
        align: "center",
        theme: night,
        transition: "spinner",
        stickers: stickers("ghost"),
      },
    ],
  })
);

console.info("→ The card “for-you” …");
await api(
  "/cards",
  json("POST", {
    title: "A card for Anna",
    slug: "for-you",
    theme: bubblegum,
    to: "Anna",
    headline: "You\nare\ngreat",
    message:
      "Just wanted to say: you're doing great. Have some cake, a nap, and a sticker or two.\n\nLots of love",
    from: "Max",
    stickers: stickers("heart", "star", "icecream"),
  })
);

console.info(`✓ Demo ready: ${base}/hello and ${base}/for-you`);
