import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { nextReleaseTag, releaseTags } from "./release-version.mjs";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const ancestor = (a, b) => {
  const result = spawnSync("git", ["merge-base", "--is-ancestor", a, b]);
  if (result.status > 1) throw new Error("Cannot verify release ancestry");
  return result.status === 0;
};
const sha = git("rev-parse", "HEAD");
if (
  process.env.GITHUB_REF !== "refs/heads/main" ||
  process.env.GITHUB_SHA !== sha
)
  throw new Error(
    "Production releases must use the exact main workflow commit.",
  );
git("fetch", "origin", "main", "--tags");
if (!ancestor(sha, "origin/main"))
  throw new Error("Release commit is not in main history.");
const tags = releaseTags(git("tag", "--list").split("\n"));
const command = process.argv[2];
if (command === "prepare") {
  const latest = tags.at(-1);
  const previous = latest ? git("rev-parse", `${latest}^{commit}`) : null;
  let shouldDeploy = true,
    tag = nextReleaseTag(tags);
  if (previous === sha) {
    shouldDeploy = false;
    tag = latest;
  } else if (previous && ancestor(sha, previous)) {
    shouldDeploy = false;
    tag = latest;
  } else if (previous && !ancestor(previous, sha))
    throw new Error("Latest release is outside this main history.");
  if (!process.env.GITHUB_OUTPUT) throw new Error("Missing GitHub output file");
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `tag=${tag}\nsha=${sha}\nshould_deploy=${shouldDeploy}\n`,
  );
  console.log(
    shouldDeploy
      ? `Planned production release ${tag} (${sha})`
      : `Already released or superseded; skipping ${sha}`,
  );
} else if (command === "tag") {
  const tag = process.env.RELEASE_TAG;
  if (!tag || tag !== nextReleaseTag(tags)) {
    if (
      tag &&
      tags.includes(tag) &&
      git("rev-parse", `${tag}^{commit}`) === sha
    ) {
      console.log("Release tag already exists for this commit.");
      process.exit(0);
    }
    throw new Error(
      "Release tag changed since deployment; refusing to overwrite tags.",
    );
  }
  git("config", "user.name", "github-actions[bot]");
  git(
    "config",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com",
  );
  git(
    "tag",
    "-a",
    tag,
    sha,
    "-m",
    `Fret Lab production ${tag}\nCommit: ${sha}\nURL: ${process.env.PRODUCTION_URL}`,
  );
  git("push", "origin", `refs/tags/${tag}`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Production ${tag}\n\n- URL: ${process.env.PRODUCTION_URL}\n- Commit: ${sha}\n- Tag: ${tag}\n`,
    );
  console.log(`Published production tag ${tag}`);
} else throw new Error("Use prepare or tag");
