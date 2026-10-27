import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const script = resolve("scripts/release.mjs");
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "fret-release-"));
  directories.push(directory);
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: directory,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "--bare", "origin.git");
  git("init", "-b", "main", "repo");
  const cwd = join(directory, "repo");
  const runGit = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  runGit("config", "user.name", "Release test");
  runGit("config", "user.email", "test@example.com");
  runGit("remote", "add", "origin", join(directory, "origin.git"));
  let revision = 0;
  const commit = () => {
    writeFileSync(join(cwd, "app.txt"), String(++revision));
    runGit("add", "app.txt");
    runGit("commit", "-m", `Change ${revision}`);
    runGit("push", "origin", "main");
    return runGit("rev-parse", "HEAD");
  };
  const invoke = (
    command: string,
    sha: string,
    tag?: string,
    ref = "refs/heads/main",
  ) => {
    const output = join(directory, "outputs");
    writeFileSync(output, "");
    const result = spawnSync(process.execPath, [script, command], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_REF: ref,
        GITHUB_SHA: sha,
        GITHUB_OUTPUT: output,
        RELEASE_TAG: tag,
        PRODUCTION_URL: "https://example.com",
      },
    });
    return { ...result, outputs: readFileSync(output, "utf8") };
  };
  return { commit, invoke, git: runGit };
}
describe("release workflow against real isolated Git repositories", () => {
  it("tags only after explicit successful-deploy stage and reruns are idempotent", () => {
    const f = fixture(),
      sha = f.commit();
    const plan = f.invoke("prepare", sha);
    expect(plan.status).toBe(0);
    expect(plan.outputs).toContain("tag=v0.1.0");
    expect(f.git("tag", "--list")).toBe("");
    expect(f.invoke("tag", sha, "v0.1.0").status).toBe(0);
    expect(f.git("rev-parse", "v0.1.0^{commit}")).toBe(sha);
    expect(f.invoke("prepare", sha).outputs).toContain("should_deploy=false");
    expect(f.invoke("tag", sha, "v0.1.0").status).toBe(0);
  });
  it("bumps a newer main commit and skips old reruns to prevent rollback", () => {
    const f = fixture(),
      first = f.commit();
    expect(f.invoke("tag", first, "v0.1.0").status).toBe(0);
    const second = f.commit();
    expect(f.invoke("prepare", second).outputs).toContain("tag=v0.1.1");
    expect(f.invoke("tag", second, "v0.1.1").status).toBe(0);
    f.git("checkout", "--detach", first);
    expect(f.invoke("prepare", first).outputs).toContain("should_deploy=false");
  });
  it("refuses feature branches, wrong SHAs and conflicting versions", () => {
    const f = fixture(),
      sha = f.commit();
    expect(
      f.invoke("prepare", sha, undefined, "refs/heads/develop").status,
    ).not.toBe(0);
    expect(f.invoke("prepare", "a".repeat(40)).status).not.toBe(0);
    expect(f.invoke("tag", sha, "v99.0.0").status).not.toBe(0);
    expect(f.git("tag", "--list")).toBe("");
  });
});
