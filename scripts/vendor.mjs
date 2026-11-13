#!/usr/bin/env node
// Copies the Skills named in sources.json from local clones into skills/<id>/<name>/ (and shared
// files into shared/<id>/), unmodified, with the upstream LICENSE as LICENSE.txt and a SOURCE.md that
// records repository, path, commit and licence. Anything that is not plain text, any script, symlink,
// unportable file name, mismatched Skill name or unpinned clone stops the run: nothing is skipped
// quietly.
//
//   node scripts/vendor.mjs --work <dir with the clones>
//
// Clones are made by hand (git clone <repo> <dir>/<clone>), checked out at the pinned commit. This
// script only reads them; it never runs anything from them.

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_EXT = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".csv", ""]);
const SEGMENT = /^[A-Za-z0-9._-]+$/u;
const RESERVED = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/iu;
const JUNK = new Set([".DS_Store", "Thumbs.db"]);
const MAX_FILE = 2 * 1024 * 1024;

function die(message) {
  console.error(`vendor: ${message}`);
  process.exit(1);
}

function git(clone, ...args) {
  return execFileSync("git", ["-C", clone, ...args], { encoding: "utf8" }).trim();
}

function frontmatterName(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  const line = match && /^name\s*:\s*(.+)$/mu.exec(match[1]);
  return line ? line[1].trim().replace(/^["']|["']$/gu, "") : undefined;
}

function listFiles(directory, problems, label) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    const info = lstatSync(full);
    if (info.isSymbolicLink()) {
      problems.push(`${label}: ${relative(directory, full)} is a symlink`);
    } else if (info.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      for (const nested of listFiles(full, problems, label)) files.push(join(entry.name, nested));
    } else if (info.isFile()) {
      if (JUNK.has(entry.name)) continue;
      files.push(entry.name);
      const path = entry.name;
      if (!SEGMENT.test(path) || path.endsWith(".") || RESERVED.test(path)) problems.push(`${label}: ${path} is not a portable file name`);
      if (!TEXT_EXT.has(extname(path).toLowerCase())) problems.push(`${label}: ${full} is not a plain text file (${extname(path) || "no extension"})`);
      if (info.size > MAX_FILE) problems.push(`${label}: ${path} is larger than 2 MiB`);
    }
  }
  return files;
}

function licenseNotice(clone) {
  const text = readFileSync(join(clone, "LICENSE"), "utf8");
  // Only a real notice ("Copyright (c) 2025 Name"), never boilerplate such as Apache-2.0's own wording.
  const copyright = text.split(/\r?\n/u).find((line) => /^\s*copyright\s*(\(c\)|©)?\s*\d{4}/iu.test(line))?.trim();
  return { text, copyright };
}

function sourceNote({ source, relPath, sha, date, copyright }) {
  return [
    "# Source",
    "",
    `Unmodified copy of \`${relPath}\` from ${source.repo}`,
    `at commit ${sha} (${date}), under the ${source.spdx} licence.`,
    ...(copyright ? ["", copyright] : []),
    "",
    "The licence text is in LICENSE.txt. Nothing in this folder was edited.",
    "",
  ].join("\n");
}

const args = process.argv.slice(2);
const workIndex = args.indexOf("--work");
if (workIndex < 0 || !args[workIndex + 1]) die("usage: vendor.mjs --work <dir with the clones>");
const work = resolve(args[workIndex + 1]);
const manifest = JSON.parse(readFileSync(join(ROOT, "sources.json"), "utf8"));
if (manifest.schema !== "alran.store.vendor/v1") die("sources.json: unknown schema");

const problems = [];
const notices = [];
const names = new Map();
const staged = [];

for (const source of manifest.sources) {
  const clone = join(work, source.clone);
  if (!existsSync(join(clone, ".git"))) die(`${source.id}: no clone at ${clone}`);
  const sha = git(clone, "rev-parse", "HEAD");
  if (sha !== source.commit) die(`${source.id}: the clone is at ${sha}, sources.json pins ${source.commit}`);
  if (git(clone, "status", "--porcelain")) die(`${source.id}: the clone has local changes`);
  const date = git(clone, "log", "-1", "--format=%cs");
  const { text: licenseText, copyright } = licenseNotice(clone);
  notices.push({ source, licenseText, sha, date, copyright });
  const unique = new Set();
  for (const name of source.skills) {
    if (unique.has(name)) problems.push(`${source.id}: ${name} listed twice`);
    unique.add(name);
    if (names.has(name)) problems.push(`${name} is in both ${names.get(name)} and ${source.id}`);
    names.set(name, source.id);
    const directory = join(clone, source.skillsDir, name);
    const label = `${source.id}/${name}`;
    if (!existsSync(join(directory, "SKILL.md"))) {
      problems.push(`${label}: no SKILL.md`);
      continue;
    }
    if (frontmatterName(readFileSync(join(directory, "SKILL.md"), "utf8")) !== name) problems.push(`${label}: SKILL.md names another skill`);
    if (existsSync(join(directory, "LICENSE.txt")) || existsSync(join(directory, "SOURCE.md"))) problems.push(`${label}: already has a LICENSE.txt or SOURCE.md`);
    listFiles(directory, problems, label);
    staged.push({ kind: "skill", source, name, directory, to: join(ROOT, "skills", source.id, name), relPath: `${source.skillsDir}/${name}`, sha, date, copyright, licenseText });
  }
  for (const shared of source.shared ?? []) {
    const directory = join(clone, shared.from);
    if (!existsSync(directory) || !statSync(directory).isDirectory()) {
      problems.push(`${source.id}: shared directory ${shared.from} is missing`);
      continue;
    }
    listFiles(directory, problems, `${source.id}/${shared.from}`);
    staged.push({ kind: "shared", source, name: shared.from, directory, to: join(ROOT, "shared", source.id, shared.to), relPath: shared.from, sha, date, copyright, licenseText });
  }
}
if (problems.length > 0) die(`refused:\n${problems.map((line) => `  ${line}`).join("\n")}`);

for (const id of new Set(manifest.sources.map((source) => source.id))) {
  rmSync(join(ROOT, "skills", id), { recursive: true, force: true });
  rmSync(join(ROOT, "shared", id), { recursive: true, force: true });
}
for (const item of staged) {
  mkdirSync(dirname(item.to), { recursive: true });
  cpSync(item.directory, item.to, { recursive: true, filter: (path) => !path.split(sep).some((part) => part === ".git" || part === "node_modules" || JUNK.has(part)) });
  writeFileSync(join(item.to, "LICENSE.txt"), item.licenseText);
  writeFileSync(join(item.to, "SOURCE.md"), sourceNote(item));
}

const lines = [
  "# Third-party notices",
  "",
  "Everything under `skills/` and `shared/` is the work of the projects below, copied unmodified under",
  "their licences. Each folder carries its own `LICENSE.txt` and `SOURCE.md`. This file is generated by",
  "`scripts/vendor.mjs`.",
  "",
  "| Source | Repository | Commit | Licence | Skills |",
  "| --- | --- | --- | --- | ---: |",
  ...notices.map(({ source, sha, date }) => `| ${source.label} | ${source.repo} | ${sha.slice(0, 7)} (${date}) | ${source.spdx} | ${source.skills.length} |`),
  "",
  "## Licence texts",
  "",
];
const seen = new Set();
for (const { source, licenseText, copyright } of notices) {
  const key = licenseText.trim();
  if (seen.has(key)) continue;
  seen.add(key);
  const users = notices.filter((entry) => entry.licenseText.trim() === key).map((entry) => entry.source.repo.replace("https://github.com/", ""));
  lines.push(`### ${source.spdx}: ${users.join(", ")}`, "", ...(copyright ? [copyright, ""] : []), "```text", licenseText.trim(), "```", "");
}
writeFileSync(join(ROOT, "THIRD_PARTY_NOTICES.md"), lines.join("\n"));

const versions = Object.fromEntries(notices.map(({ source, sha, date }) => [source.id, `${date.split("-").map(Number).join(".")}+${sha.slice(0, 7)}`]));
console.log(`vendored ${staged.filter((item) => item.kind === "skill").length} skills from ${manifest.sources.length} sources`);
console.log(`versions (store/store.config.json, skills.versions): ${JSON.stringify(versions)}`);
