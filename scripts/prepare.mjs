// Runs before `pnpm dev` and `pnpm build`.
//
// Downloads the themes' fonts (Indian Type Foundry, ITF Free Font License)
// from Fontshare into public/fonts/: Switzer (grotesk), Pally (rounded) and
// Gambarino (serif). The license allows self-hosting for your own website but
// no redistribution, so the files are not in git (public/fonts/ is ignored)
// but fetched here. If a download fails, the build goes on: that font's
// themes then use the system font.
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const target = fileURLToPath(new URL("../public/fonts/", import.meta.url));

/** Fontshare's slug → the files to keep from its archive. */
const FONTS = {
  switzer: ["Switzer-Variable.woff2", "Switzer-VariableItalic.woff2"],
  pally: ["Pally-Variable.woff2"],
  gambarino: ["Gambarino-Regular.woff2"],
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

await mkdir(target, { recursive: true });

for (const [slug, names] of Object.entries(FONTS)) {
  const missing = [];
  for (const name of names) {
    if (!(await exists(join(target, name)))) missing.push(name);
  }
  if (missing.length === 0) continue;
  try {
    const response = await fetch(
      `https://api.fontshare.com/v2/fonts/download/${slug}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const pick = (suffix) => {
      const entry = Object.keys(archive).find((path) => path.endsWith(suffix));
      if (!entry) throw new Error(`${suffix} missing in the archive`);
      return archive[entry];
    };
    for (const name of missing) {
      await writeFile(join(target, name), pick(`WEB/fonts/${name}`));
    }
    await writeFile(
      join(target, `${slug}-license.txt`),
      pick("License/FFL.txt")
    );
    console.info(`✓ ${slug} loaded into public/fonts/`);
  } catch (error) {
    console.warn(
      `⚠ ${slug} could not be loaded (${error.message}) – its themes use the system font.`
    );
  }
}
