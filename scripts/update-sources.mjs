#!/usr/bin/env node
// Looks up the upstream head of every source in sources.json and, with --apply, moves the pins to it,
// clones every source and vendors the Skills again.
//
//   node scripts/update-sources.mjs --work <dir with the clones> [--apply] [--report <file>]
//
// A source marked "frozen" (its upstream repository is gone) is left alone, and a source whose repository
// cannot be reached keeps its pin. The Superpowers package is not a source here: its files are pinned by
// SHA-256 and have to be read again by hand before they are accepted.
//
// Without --apply nothing is written except the report; the script then only says what has moved.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const work = value("--work");
if (!work) {
  console.error("usage: update-sources.mjs --work <dir with the clones> [--apply] [--report <file>]");
  process.exit(1);
}
const apply = args.includes("--apply");
const reportFile = value("--report");

const manifest = JSON.parse(readFileSync(join(ROOT, "sources.json"), "utf8"));
if (manifest.schema !== "alran.store.vendor/v1") {
  console.error("sources.json: unknown schema");
  process.exit(1);
}

function git(args, cwd) {
  return execFileSync("git", cwd ? ["-C", cwd, ...args] : args, { encoding: "utf8" }).trim();
}

/** The head of a repository's default branch, or undefined when it cannot be reached. */
function upstreamHead(repo) {
  try {
    const line = git(["ls-remote", repo, "HEAD"]);
    return line.split(/\s+/u)[0];
  } catch {
    return undefined;
  }
}

/** A shallow clone of one commit, the way scripts/vendor.mjs expects to find it. */
function cloneAt(repo, directory, commit) {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  git(["init", "-q"], directory);
  git(["remote", "add", "origin", repo], directory);
  git(["fetch", "-q", "--depth", "1", "origin", commit], directory);
  git(["checkout", "-q", "FETCH_HEAD"], directory);
}

const moved = [];
const unchanged = [];
const unreachable = [];
const frozen = [];

for (const source of manifest.sources) {
  if (source.frozen) {
    frozen.push({ source: source.id, repo: source.repo, commit: source.commit });
    continue;
  }
  const head = upstreamHead(source.repo);
  if (!head) {
    unreachable.push({ source: source.id, repo: source.repo, commit: source.commit });
    continue;
  }
  if (head === source.commit) unchanged.push({ source: source.id, repo: source.repo, commit: head });
  else moved.push({ source: source.id, repo: source.repo, from: source.commit, to: head });
}

const report = {
  moved,
  unchanged: unchanged.map((entry) => entry.source),
  unreachable,
  frozen,
};
if (reportFile) writeFileSync(resolve(reportFile), `${JSON.stringify(report, null, 2)}\n`);

console.log(`${manifest.sources.length} sources: ${moved.length} moved, ${unchanged.length} unchanged, ${unreachable.length} unreachable, ${frozen.length} frozen`);
for (const entry of moved) console.log(`  moved   ${entry.source}: ${entry.from.slice(0, 7)} -> ${entry.to.slice(0, 7)}`);
for (const entry of unreachable) console.log(`  gone    ${entry.source}: ${entry.repo} cannot be reached, the pin is kept`);
for (const entry of frozen) console.log(`  frozen  ${entry.source}: ${entry.repo} is gone, the vendored Skills stay as they are`);

if (!apply) {
  console.log("nothing was changed; run again with --apply to move the pins and vendor again");
  process.exit(0);
}
if (moved.length === 0) {
  console.log("no source has moved");
  process.exit(0);
}

// The pins move first: scripts/vendor.mjs reads the pin and checks that the clone is at it.
for (const entry of moved) {
  const source = manifest.sources.find((candidate) => candidate.id === entry.source);
  source.commit = entry.to;
}
writeFileSync(join(ROOT, "sources.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`sources.json: ${moved.length} pins moved`);

for (const source of manifest.sources) {
  if (source.frozen) continue;
  const directory = join(resolve(work), source.clone);
  process.stdout.write(`cloning ${source.id}... `);
  cloneAt(source.repo, directory, source.commit);
  console.log(source.commit.slice(0, 7));
}

execFileSync("node", [join(ROOT, "scripts", "vendor.mjs"), "--work", resolve(work)], { stdio: "inherit" });
