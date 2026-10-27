import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
const sites =
  process.env.FRET_LAB_TARGET === "sites" || process.argv.includes("--sites");
const cloudflare =
  sites ||
  process.env.FRET_LAB_TARGET === "cloudflare" ||
  process.argv.includes("--cloudflare");
const result = spawnSync(
  process.execPath,
  ["node_modules/nuxt/bin/nuxt.mjs", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...(cloudflare
        ? {
            NITRO_PRESET: "cloudflare_module",
            FRET_LAB_TARGET: sites ? "sites" : "cloudflare",
          }
        : {}),
    },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
if (!sites) process.exit(0);
// Keep the normal Node build available; adapt the native Nitro Worker output to Sites.
await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp(".output/server", "dist/server/nitro", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
const types = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
const assets = {};
async function collect(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    const pathname = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await collect(file, pathname);
    else if (
      !entry.name.endsWith(".map") &&
      !["_headers", "_redirects"].includes(entry.name)
    ) {
      assets[pathname] = {
        body: (await readFile(file)).toString("base64"),
        type: types[path.extname(file)] || "application/octet-stream",
      };
    }
  }
}
await collect(".output/public");
await writeFile(
  "dist/server/assets.js",
  `export default ${JSON.stringify(assets)};\n`,
);
await cp("scripts/sites-worker.mjs", "dist/server/index.js");
console.log(
  `Sites Worker packaged with ${Object.keys(assets).length} embedded static assets.`,
);
