import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { buildConfig } from "payload";
import sharp from "sharp";
import { seedAdmin } from "@/features/admin/seed-admin";
import { Users } from "@/features/admin/users";
import { Cards } from "@/features/cards/collection";
import { Decks } from "@/features/decks/collection";
import { Media } from "@/features/media/collection";
import { Themes } from "@/features/themes/collection";
import { editor } from "@/lib/editor";
import { serverUrl } from "@/lib/server-url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * ppp's backend – slides and greeting cards, just for me:
 *
 * - decks    slides to present, each slide a design (features/decks)
 * - cards    greeting cards that turn over (features/cards)
 * - themes   color schemes, fonts and backgrounds (features/themes)
 * - media    pictures, stickers, background videos
 * - users    the admin login
 *
 * Everything that differs between machines comes from the environment (see
 * .env.example).
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: {
      titleSuffix: "· ppp",
      icons: [{ rel: "icon", type: "image/svg+xml", url: "/icon.svg" }],
    },
    livePreview: {
      breakpoints: [
        { label: "Laptop", name: "laptop", width: 1440, height: 900 },
        { label: "Phone", name: "phone", width: 390, height: 844 },
      ],
    },
  },
  // The admin's groups follow this order.
  collections: [Decks, Cards, Media, Themes, Users],
  // The login cookie, `ppp-token` – only sent along from our own pages.
  cookiePrefix: "ppp",
  csrf: [serverUrl()],
  // REST only – nothing reads GraphQL.
  graphQL: { disable: true },
  editor,
  db: mongooseAdapter({
    url: process.env.DATABASE_URL ?? "",
    connectOptions: {
      serverSelectionTimeoutMS: 5000,
      // Close idle sockets before the Docker network quietly drops them –
      // otherwise the next query after a pause takes a dead one (ECONNRESET).
      maxIdleTimeMS: 10_000,
      retryReads: true,
      retryWrites: true,
    },
  }),
  secret: process.env.PAYLOAD_SECRET ?? "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  // The first admin (from the environment). Errors must not stop the start.
  onInit: async (payload) => {
    try {
      await seedAdmin(payload);
    } catch (error) {
      payload.logger.warn(
        `Admin seeding skipped: ${error instanceof Error ? error.message : error}`
      );
    }
  },
});
