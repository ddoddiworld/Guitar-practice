const pattern = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function releaseTags(tags) {
  return tags
    .filter((tag) => pattern.test(tag))
    .sort((left, right) => {
      const a = left.slice(1).split(".").map(BigInt),
        b = right.slice(1).split(".").map(BigInt);
      for (let i = 0; i < 3; i++)
        if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
      return 0;
    });
}
export function nextReleaseTag(tags) {
  const latest = releaseTags(tags).at(-1);
  if (!latest) return "v0.1.0";
  const [major, minor, patch] = latest.slice(1).split(".").map(BigInt);
  return `v${major}.${minor}.${patch + 1n}`;
}
export function releaseMetadata(tag, sha) {
  if (!tag && !sha) return null;
  if (!pattern.test(tag || "") || !/^[a-f0-9]{40}$/.test(sha || ""))
    throw new Error(
      "Both a valid release tag and full commit SHA are required.",
    );
  return { version: tag, commit: sha };
}
