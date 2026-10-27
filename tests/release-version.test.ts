import { describe, it, expect } from "vitest";
import {
  nextReleaseTag,
  releaseTags,
  releaseMetadata,
} from "../scripts/release-version.mjs";
describe("production release versions", () => {
  it("starts at v0.1.0 and ignores unrelated and prerelease tags", () => {
    expect(nextReleaseTag(["demo", "v1.0.0-rc.1", "v01.1.1"])).toBe("v0.1.0");
  });
  it("compares semver numerically and bumps patches", () => {
    expect(nextReleaseTag(["v0.9.9", "v0.10.2", "v0.10.11"])).toBe("v0.10.12");
    expect(nextReleaseTag(["v1.0.0", "v0.99.99"])).toBe("v1.0.1");
  });
  it("does not overflow large version components", () => {
    expect(nextReleaseTag(["v1.2.99999999999999999999"])).toBe(
      "v1.2.100000000000000000000",
    );
  });
  it("sorts stable release tags only", () => {
    expect(releaseTags(["v2.0.0", "v1.9.9", "v2.0.0+meta", "random"])).toEqual([
      "v1.9.9",
      "v2.0.0",
    ]);
  });
  it("requires a valid tag and exact SHA together", () => {
    expect(releaseMetadata(undefined, undefined)).toBe(null);
    expect(releaseMetadata("v0.1.0", "a".repeat(40))).toEqual({
      version: "v0.1.0",
      commit: "a".repeat(40),
    });
    expect(() => releaseMetadata("v0.1.0", undefined)).toThrow();
    expect(() => releaseMetadata("v0.1.0", "short")).toThrow();
  });
});
