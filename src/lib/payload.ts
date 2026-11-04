import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";

/** Payload's local API – one instance per server process. */
export const payload = () => getPayload({ config });

/**
 * The admin looking at the page, if any – they may arrange stickers and see
 * the overview. Once per request.
 */
export const viewer = cache(async () => {
  const { user } = await (await payload()).auth({ headers: await headers() });
  return user ?? null;
});
