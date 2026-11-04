import type { MetadataRoute } from "next";

/** Just for me and whoever gets a link – nothing for search engines. */
const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: "*", disallow: "/" }],
});

export default robots;
