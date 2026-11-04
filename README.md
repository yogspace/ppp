# ppp

Slides and greeting cards, just for me – cute, springy, with stickers you can throw around. Live: [ppp.mxwr.de](https://ppp.mxwr.de)

## What it does

- **Decks** at `/<slug>`: the first slide is `/<slug>`, the next ones `/<slug>/1`, `/<slug>/2` … Every slide picks a **design** (Big type, Title, Text, List, Picture, Words + picture, Gallery, Quote, Just stickers), a **theme** (or the deck's) and a **transition** (or the deck's). Words drop in word by word, pictures fly in, a List can show one point per click.
- **Transitions**, per slide: the good ones (Swipe, Boing, Pop, Toss, Flip, Hinge, Jelly, Zoom, Blob, Confetti, Curtain, Fade, Cut), the 💾 PowerPoint 2003 ones (Spinner, Checkerboard, Blinds, Dissolve, Star wipe, Heart wipe, Clock) and 🎲 Surprise me.
- **Cards** at `/<slug>`: an envelope – the address, a stamp (a sticker with a perforated edge), a postmark. A tap: it turns over, the seal pops off, the card slides out. Its front: big words and stickers; a tap folds it open upwards (made for a phone held upright): “Dear …,”, the message, the signature.
- **Themes** (admin → Themes): background, text and accent colors, a font (Switzer, Pally, Gambarino), headlines in capitals or not, a background (plain, sketchbook lines, drifting dots, 3D floaties, a picture or video) and grain. A card's paper has colors of its own.
- **Stickers**: PNGs with a transparent background. In the browser each becomes glossy 3D vinyl with a white die-cut rim (three.js): the picture's shape grown by the rim, traced (d3-contour), extruded with a rounded edge, its shadow on the slide. They lean towards the pointer, fly in, and can be dragged and thrown by anyone – they glide on and bounce off the edges.
- **Arranging**: logged in, `E` (or the star button) – drag a sticker where it belongs, it is saved; a double click puts it back on its default spot.

Just for me: the front page shows the overview only when logged in; nothing is indexed (`noindex`, `robots.txt`).

## Stack

Next.js 16, React 19, Tailwind CSS 4, motion, three.js, Payload 3 on MongoDB, Biome, Vitest, pnpm. Docker image on GHCR, deployed to the Hetzner server behind Caddy (see the `proxy` repo).

## Structure

- `src/features/decks` – the `decks` collection, the slide designs (blocks), a deck as the player gets it
- `src/features/cards` – the `cards` collection, the card page and its envelope
- `src/features/player` – playing a deck: navigation and addresses (`steps.ts`), the stage, a slide's frame, the designs' views, the controls
- `src/features/transitions` – their list (`kinds.ts`), the frames' motion (`frames.ts`), the wipes' clip paths (`reveal.ts`), the covers (`overlay.tsx`)
- `src/features/stickers` – placements (`arrangement.ts`), the outline (`outline.ts`, `art.ts`), the 3D renderer, dragging and throwing (`sticker.tsx`), saving an arrangement
- `src/features/themes` – the `themes` collection, a theme as CSS variables
- `src/features/backdrop` – a slide's background, the 3D floaties
- `src/features/media`, `admin`, `slug` – uploads, the admin login, addresses shared by decks and cards

Where a sticker sits is kept apart from the admin's form – a document's `arrangement` (by the sticker's row id), written only by `POST /api/<decks|cards>/:id/arrange`; the form can't write it, so saving in the admin never undoes an arrangement made on the page.

## Playing a deck

→ ↓ space Enter, a click or tap on the right, a swipe left: on. ← ↑ Backspace, a click or tap on the left, a swipe right: back. Home / End, F full screen, E arranges the stickers (logged in). The browser's back goes a slide back.

## Development

```bash
pnpm install
cp .env.example .env      # PAYLOAD_SECRET (openssl rand -hex 32), the admin
make up-db                # MongoDB on localhost:27020
pnpm dev                  # http://localhost:3000, admin at /admin
pnpm seed:demo            # stickers, themes, the deck “hello”, the card “for-you”
```

- `pnpm seed:demo https://ppp.mxwr.de` seeds production the same way (logs in with `PAYLOAD_ADMIN_EMAIL`/`PAYLOAD_ADMIN_PASSWORD`).
- After changing collections: `pnpm generate:types`; after adding admin components: `pnpm generate:importmap`.
- Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `pnpm payload:sync` fetches production's database and uploads.

### Fonts

Switzer, Pally and Gambarino (Indian Type Foundry, ITF Free Font License) are self-hosted. The license forbids redistribution, so they are **not in the repo**: `scripts/prepare.mjs` downloads them from Fontshare into `public/fonts/` (ignored) before `dev` and `build`.

## Deploy

Push to `main` (or `make deploy` from `development`): the pipeline (`.github/workflows/deploy.yml`) runs lint, types and tests, builds the image and deploys it to `/opt/apps/ppp` on the server; Caddy routes `ppp.mxwr.de → ppp:3000`.

Repository **variable**: `NEXT_PUBLIC_SERVER_URL`. **Secrets**: `HETZNER_HOST`, `HETZNER_USER`, `HETZNER_SSH_KEY`, `PAYLOAD_SECRET`, `PAYLOAD_ADMIN_EMAIL`, `PAYLOAD_ADMIN_PASSWORD` (the first admin). The server's `.env` is rewritten from them on every deploy.
