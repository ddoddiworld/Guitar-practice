import nitro from "./nitro/index.mjs";
import assets from "./assets.js";
export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];
    if (asset) {
      if (request.method !== "GET" && request.method !== "HEAD")
        return new Response(null, {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      const bytes = Uint8Array.from(atob(asset.body), (character) =>
        character.charCodeAt(0),
      );
      return new Response(request.method === "HEAD" ? null : bytes, {
        headers: {
          "Content-Type": asset.type,
          "Content-Length": String(bytes.length),
          "Cache-Control": url.pathname.startsWith("/_nuxt/")
            ? "public, max-age=31536000, immutable"
            : "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    return nitro.fetch(request, env, context);
  },
};
