import type { Payload } from "payload";
import type { SeedKey } from "./definitions";
import { seedDemo } from "./demo";

/** Each seed, run – its summary for the admin. */
const runners: Record<
  SeedKey,
  (payload: Payload, replace: boolean) => Promise<string>
> = {
  demo: (payload, replace) => seedDemo(payload, replace ? "replace" : "fill"),
};

export const runSeed = (key: SeedKey, payload: Payload, replace: boolean) =>
  runners[key](payload, replace);
