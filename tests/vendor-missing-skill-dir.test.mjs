import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const vendorScript = join(repoRoot, "scripts", "vendor.mjs");

function fixture({ skillsDirs, include = "clean", skills } = {}) {
  const root = mkdtempSync(join(tmpdir(), "alran-store-vendor-test-"));
  const work = join(root, "clones");
  const clone = join(work, "fixture");
  mkdirSync(join(root, "scripts"), { recursive: true });
  mkdirSync(clone, { recursive: true });
  copyFileSync(vendorScript, join(root, "scripts", "vendor.mjs"));
  writeFileSync(join(clone, "LICENSE"), "MIT License\n\nCopyright (c) 2026 Fixture Authors\n");
  if (skillsDirs?.includes(".agents/skills")) {
    const skill = join(clone, ".agents", "skills", "fixture-skill");
    mkdirSync(skill, { recursive: true });
    writeFileSync(join(skill, "SKILL.md"), [
      "---",
      "name: fixture-skill",
      "description: A small fixture used to test source directory handling.",
      "---",
      "",
      "# Fixture skill",
      "",
    ].join("\n"));
  }

  execFileSync("git", ["init", "-q"], { cwd: clone });
  execFileSync("git", ["config", "user.name", "Store test"], { cwd: clone });
  execFileSync("git", ["config", "user.email", "store-test@example.invalid"], { cwd: clone });
  execFileSync("git", ["add", "-A"], { cwd: clone });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: clone });
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: clone, encoding: "utf8" }).trim();

  writeFileSync(join(root, "sources.json"), JSON.stringify({
    schema: "alran.store.vendor/v1",
    reservedNames: [],
    sources: [{
      id: "fixture",
      label: "Fixture",
      repo: "https://example.invalid/fixture",
      clone: "fixture",
      commit,
      spdx: "MIT",
      skillsDirs,
      ...(include !== null ? { include } : {}),
      ...(skills ? { skills } : {}),
    }],
  }, null, 2));
  return { root, work, clone, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

test("clean sources skip a missing optional Skills directory when another directory remains", (t) => {
  const f = fixture({ skillsDirs: [".agents/skills", "plugins/reactive-resume/skills"] });
  t.after(f.cleanup);
  const result = spawnSync(process.execPath, [join(f.root, "scripts", "vendor.mjs"), "--work", f.work], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr + result.stdout, /plugins\/reactive-resume\/skills is missing; skipping it/);
  assert.match(readFileSync(join(f.root, "skills", "fixture", "fixture-skill", "SKILL.md"), "utf8"), /Fixture skill/);
});

test("clean sources still fail when every configured Skills directory is missing", (t) => {
  const f = fixture({ skillsDirs: ["missing-a", "missing-b"] });
  t.after(f.cleanup);
  const result = spawnSync(process.execPath, [join(f.root, "scripts", "vendor.mjs"), "--work", f.work], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /none of its configured Skills directories exist/);
});

test("explicitly named Skills keep missing directories as hard errors", (t) => {
  const f = fixture({ skillsDirs: [".agents/skills", "missing"], include: null, skills: ["fixture-skill"] });
  t.after(f.cleanup);
  const result = spawnSync(process.execPath, [join(f.root, "scripts", "vendor.mjs"), "--work", f.work], {
    cwd: f.root,
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /configured Skills directory missing does not exist/);
});
