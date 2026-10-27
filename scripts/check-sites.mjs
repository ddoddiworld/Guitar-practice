import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const { default: worker } = await import("../dist/server/index.js");
const assets = (await import("../dist/server/assets.js")).default;
const context = { waitUntil() {} };
const response = await worker.fetch(
  new Request("https://fret-lab.test/"),
  {},
  context,
);
assert.equal(response.status, 200);
assert.match(await response.text(), /Fret Lab/);
const javascript = Object.keys(assets).find((path) => path.endsWith(".js"));
assert.ok(javascript);
const assetResponse = await worker.fetch(
  new Request("https://fret-lab.test" + javascript),
  {},
  context,
);
assert.equal(assetResponse.status, 200);
assert.match(assetResponse.headers.get("Content-Type"), /javascript/);
assert.ok((await assetResponse.text()).length > 0);
const head = await worker.fetch(
  new Request("https://fret-lab.test" + javascript, { method: "HEAD" }),
  {},
  context,
);
assert.equal(head.status, 200);
assert.equal(await head.text(), "");
const denied = await worker.fetch(
  new Request("https://fret-lab.test" + javascript, { method: "POST" }),
  {},
  context,
);
assert.equal(denied.status, 405);
const noKey = await worker.fetch(
  new Request("https://fret-lab.test/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }),
  {},
  context,
);
assert.equal(noKey.status, 503);
assert.match(await noKey.text(), /API 키/);
const hosting = JSON.parse(await readFile("dist/.openai/hosting.json", "utf8"));
assert.equal(hosting.project_id, "appgprj_6ae0033639a081918b3faa15298da37f");
console.log(
  "Sites Worker smoke checks passed: SSR, JS asset, HEAD, method rejection, missing-key API, project identity.",
);
