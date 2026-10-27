import { releaseMetadata } from "./release-version.mjs";
const expected = releaseMetadata(
  process.env.RELEASE_TAG,
  process.env.RELEASE_SHA,
);
if (!expected) throw new Error("Release identity is required");
const url = new URL("/release.json", process.env.PRODUCTION_URL);
url.searchParams.set("release", `${expected.version}-${expected.commit}`);
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const response = await fetch(url, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error(`Release endpoint returned ${response.status}`);
    const actual = await response.json();
    if (
      actual.version !== expected.version ||
      actual.commit !== expected.commit
    )
      throw new Error("Live release does not match the deployed commit");
    const home = await fetch(new URL("/", url), {
      signal: AbortSignal.timeout(10000),
    });
    if (!home.ok || !(await home.text()).includes("Fret Lab"))
      throw new Error("Production home is not healthy");
    console.log(`Verified live ${actual.version} (${actual.commit})`);
    process.exit(0);
  } catch (error) {
    console.log(`Verification ${attempt + 1}/12: ${error.message}`);
    if (attempt === 11) throw error;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
