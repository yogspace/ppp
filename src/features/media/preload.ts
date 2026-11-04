import type { Picture } from "./picture";

/** Pictures asked for already – kept, so the browser keeps them decoded. */
const loaded = new Map<string, HTMLImageElement>();

const isPicture = (value: object): value is Picture =>
  "src" in value &&
  typeof value.src === "string" &&
  "video" in value &&
  typeof value.video === "boolean";

/** Every picture in a slide's data, however deep. */
export const picturesIn = (value: unknown, out: Picture[] = []): Picture[] => {
  if (!value || typeof value !== "object") return out;
  if (isPicture(value)) {
    out.push(value);
    return out;
  }
  for (const item of Array.isArray(value) ? value : Object.values(value)) {
    picturesIn(item, out);
  }
  return out;
};

/**
 * Fetched and decoded ahead, so a picture is there the moment it is shown
 * – a List's pictures, which change with each point, or the next slide's.
 * Videos are left to load as they play.
 */
export const preload = (pictures: Picture[]) => {
  for (const picture of pictures) {
    if (picture.video || loaded.has(picture.src)) continue;
    const image = new Image();
    image.decoding = "async";
    image.src = picture.src;
    image.decode().catch(() => loaded.delete(picture.src));
    loaded.set(picture.src, image);
  }
};
