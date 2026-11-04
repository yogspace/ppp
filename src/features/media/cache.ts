/**
 * Uploaded files may be kept by the browser for a day – a slide's pictures
 * come at once the next time instead of being asked for again. A day, not
 * forever: a file replaced under the same name shows by tomorrow.
 */
export const cacheFiles = ({ headers }: { headers: Headers }) => {
  headers.set(
    "Cache-Control",
    "public, max-age=86400, stale-while-revalidate=604800"
  );
  return headers;
};
