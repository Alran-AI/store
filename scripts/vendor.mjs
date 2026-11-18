#!/usr/bin/env node
// Copies Skills from local clones into skills/<id>/<name>/ (and shared files into shared/<id>/),
// unmodified, with the upstream LICENSE as LICENSE.txt and a SOURCE.md that records repository, path,
// commit and licence. A Skill that breaks an admission rule is not taken: for a named Skill that stops
// the run, for a source that takes "all clean" Skills it is left out and listed in EXCLUDED.md with the
// reason, so nothing disappears quietly.
//
//   node scripts/vendor.mjs --work <dir with the clones>
//
// Clones are made by hand (git clone <repo> <dir>/<clone>) and checked out at the pinned commit. This
// script only reads them; it never runs anything from them.
//
// sources.json, per source:
//   id, label, repo, clone, commit, spdx
//   skillsDirs: ["skills"]        folders (relative to the clone) that hold one folder per Skill
//   skills: ["a", "b"]            exactly these Skills (each must be admitted), or
//   include: "clean"              every Skill that is admitted, minus `exclude: ["x"]`
//   shared: [{from, to}]          shared files the Skills link to (copied to shared/<id>/<to>)

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT_EXT = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".csv", ""]);
// An image cannot be read as text, but it cannot run either: a Skill may carry its own icon.
// Raster formats only — an SVG is a document and may carry a script.
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
// A Skill may be vendored without these folders when its own text does not point at them.
const DROPPABLE = new Set(["scripts", "evals"]);
// A Skill that mentions its scripts or its evals is not complete without them.
const MENTIONS_CODE = /\bscripts?\b|\bevals?\b/iu;
const SEGMENT = /^[A-Za-z0-9._-]+$/u;
const RESERVED = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/iu;
const JUNK = new Set([".DS_Store", "Thumbs.db"]);
const MAX_FILE = 2 * 1024 * 1024;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
// Text that has no business in a Skill, whatever the source. Some patterns are refused anywhere; the others
// are refused unless the line itself marks them as a bad example ("# Attack: ...", "// DANGEROUS", "e.g.").
const REFUSED_ANYWHERE = [
  [/[\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/u, "contains invisible characters"],
  [/data:[a-z]+\/[a-z0-9.+-]+;base64,/iu, "embeds a data URI"],
];
const REFUSED_PER_LINE = [
  [/curl[^\n|]*\|\s*(ba)?sh/iu, "pipes a download into a shell"],
  [/wget[^\n|]*\|\s*(ba)?sh/iu, "pipes a download into a shell"],
  [/base64\s+(-d|--decode)/iu, "decodes a base64 blob"],
  [/<script\b[^>]*\ssrc=["']https?:\/\/(?!js\.stripe\.com)/iu, "loads a remote script"],
  [/ignore (all )?(previous|prior) instructions/iu, "contains an instruction-override phrase"],
];
const BAD_EXAMPLE = /\b(attack\w*|dangerous|malicious|insecure|vulnerab\w*|exploit\w*|never|do not|don't|avoid|untrusted|injection|for example|such as|wrong|bad)\b|e\.g\./iu;

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

/** The text of one frontmatter field, including the lines of a folded or literal block. */
function frontmatterField(text, field) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) return undefined;
  const lines = match[1].split(/\r?\n/u);
  const start = lines.findIndex((line) => new RegExp(`^${field}\\s*:`, "u").test(line));
  if (start < 0) return undefined;
  const parts = [lines[start].slice(lines[start].indexOf(":") + 1).trim()];
  for (let i = start + 1; i < lines.length && /^\s+\S/u.test(lines[i]); i += 1) parts.push(lines[i].trim());
  return parts.join(" ").replace(/^[>|][-+]?\s*/u, "").trim();
}

/**
 * A frontmatter field as the store's Plugin validator reads it: a flat mapping of scalars, one
 * value per line. A value that only continues on the lines below its key is not a scalar, and the
 * validator does not accept it.
 */
function frontmatterScalar(text, field) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) return undefined;
  const line = match[1].split(/\r?\n/u).find((entry) => new RegExp(`^${field}\\s*:`, "u").test(entry));
  if (!line) return undefined;
  return line.slice(line.indexOf(":") + 1).trim().replace(/^"(.*)"$/su, "$1").replace(/^'(.*)'$/su, "$1").trim();
}

/** The frontmatter keys that appear twice; the validator rejects a Skill with those. */
function frontmatterDuplicateKeys(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  if (!match) return [];
  const seen = new Set();
  const twice = new Set();
  for (const line of match[1].split(/\r?\n/u)) {
    const field = /^([A-Za-z0-9_-]+)\s*:/u.exec(line);
    if (!field) continue;
    if (seen.has(field[1])) twice.add(field[1]);
    else seen.add(field[1]);
  }
  return [...twice];
}

/** Every file under `directory` as paths relative to it; records problems with the file kinds. */
function listFiles(directory, reasons) {
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const info = lstatSync(full);
      if (info.isSymbolicLink()) {
        reasons.push(`${relative(directory, full)} is a symlink`);
      } else if (info.isDirectory()) {
        if (entry.name !== ".git" && entry.name !== "node_modules") walk(full);
      } else if (info.isFile()) {
        if (JUNK.has(entry.name)) continue;
        const path = relative(directory, full);
        files.push(path);
        if (path.split(sep).some((segment) => !SEGMENT.test(segment) || segment.endsWith(".") || RESERVED.test(segment))) {
          reasons.push(`${path} is not a portable file name`);
        }
        const ext = extname(path).toLowerCase();
        if (!TEXT_EXT.has(ext) && !IMAGE_EXT.has(ext)) reasons.push(`${path} is not a plain text or image file (${ext || "no extension"})`);
        if (info.size > MAX_FILE) reasons.push(`${path} is larger than 2 MiB`);
      }
    }
  };
  walk(directory);
  return files;
}

/** Reasons a Skill folder may not enter the store; empty when it is admitted (links are checked later). */
function admit(directory, name) {
  const reasons = [];
  if (!SKILL_NAME.test(name)) reasons.push(`"${name}" is not a Skill name`);
  if (!existsSync(join(directory, "SKILL.md"))) return { reasons: [...reasons, "has no SKILL.md"], dropped: [] };
  return admitReasons(directory, name, reasons);
}

/** The rest of the checks, on a Skill that has a SKILL.md. */
function admitReasons(directory, name, reasons) {
  const skillText = readFileSync(join(directory, "SKILL.md"), "utf8");
  if (frontmatterName(skillText) !== name) reasons.push("SKILL.md names another skill than its folder");
  // the store's Plugin validator reads a flat mapping of scalars: the description has to be a value
  // on the line of its key, and no key may appear twice
  if (!frontmatterScalar(skillText, "description")) reasons.push("SKILL.md has no description");
  const twice = frontmatterDuplicateKeys(skillText);
  if (twice.length > 0) reasons.push(`SKILL.md has the frontmatter key ${twice.join(", ")} twice`);
  // A Skill that needs an MCP server cannot work here: Alran Code sets up no MCP connectors, so
  // the Skill would ask for a tool that does not exist. A Skill that names an MCP server and a way
  // around it (a CLI, an SDK, curl, an API) is kept.
  const compatibility = frontmatterField(skillText, "compatibility");
  const wayAround = /\boptional\b|\bbest with\b|\bworks? without\b|fall\s?back|\bwithout (?:either|it|them|mcp)\b|\bif (?:available|unavailable|not available)\b|\bwhen (?:available|configured)\b|\bmay use\b|\bcli\b|\bsdk\b|\bcurl\b|\bwget\b|\brest api\b|\bhttp api\b/iu;
  if (compatibility && /\bmcp(?:\b|_)/iu.test(compatibility) && !wayAround.test(compatibility)) {
    reasons.push("needs an MCP server that Alran Code does not set up");
  }
  if (existsSync(join(directory, "LICENSE.txt")) || existsSync(join(directory, "SOURCE.md"))) reasons.push("already has a LICENSE.txt or SOURCE.md");
  const files = listFiles(directory, reasons);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext) || ext === "") continue;
    const text = readFileSync(join(directory, file), "utf8");
    for (const [pattern, why] of REFUSED_ANYWHERE) if (pattern.test(text)) reasons.push(`${file} ${why}`);
    for (const line of text.split(/\r?\n/u)) {
      if (BAD_EXAMPLE.test(line)) continue;
      for (const [pattern, why] of REFUSED_PER_LINE) if (pattern.test(line)) reasons.push(`${file} ${why}`);
    }
  }
  return { reasons: [...new Set(reasons)], dropped: [] };
}

/**
 * A Skill whose only fault is a `scripts/` or `evals/` folder may still enter the store without it:
 * the folder holds code the store cannot carry, and the Skill is worth keeping as long as its own
 * text never points at the folder. A Skill that says "run scripts/analyze.py" and gets the folder
 * taken away points at a file that is not there, which is worse than not being in the store at all.
 *
 * Returns the reasons the Skill still has, and the folders that may be left out.
 */
function admitWithoutCode(directory, name) {
  const first = admit(directory, name);
  if (first.reasons.length === 0) return { reasons: [], dropped: [] };
  const code = first.reasons.filter((reason) => {
    const match = /^(.+) is not a plain text or image file/u.exec(reason);
    return match && DROPPABLE.has(match[1].split("/")[0]);
  });
  if (code.length === 0) return first;
  const other = first.reasons.filter((reason) => !code.includes(reason));
  if (other.length > 0) return first;
  const folders = [...new Set(code.map((reason) => /^(.+) is not a plain text or image file/u.exec(reason)[1].split("/")[0]))];
  // The text that stays has to be complete on its own: no mention of the folder that is left out.
  for (const file of listFiles(directory, [])) {
    if (folders.some((folder) => file.split("/")[0] === folder)) continue;
    const ext = extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext) || ext === "") continue;
    if (MENTIONS_CODE.test(readFileSync(join(directory, file), "utf8"))) return first;
  }
  return { reasons: [], dropped: folders };
}

/** Relative Markdown links of a Skill folder that leave it: [{ file, link, target }] (target is absolute). */
function outwardLinks(directory, dropped) {
  const links = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) {
        if (dropped?.some((folder) => relative(directory, full).split(sep)[0] === folder)) continue;
        const text = readFileSync(full, "utf8");
        for (const match of text.matchAll(/\]\(([^)\s]+)\)/gu)) {
          let link = match[1];
          if (/^(https?:|mailto:|#|<)/u.test(link)) continue;
          link = link.split("#")[0].split("?")[0];
          if (!link) continue;
          const target = resolve(dirname(full), decodeURIComponent(link));
          if (target !== directory && !target.startsWith(directory + sep)) links.push({ file: relative(directory, full), link, target });
        }
      }
    }
  };
  walk(directory);
  return links;
}

/** The licence file of a clone: LICENSE, or LICENSE.txt / LICENSE.md / LICENSE-MIT / LICENSE-APACHE /
 * LICENSE-CC-BY-4.0 when the repository names it so. A source that ships under several licences says
 * which one covers what it hands over. */
function licenseFile(clone, named) {
  const names = named ? [named, "LICENSE", "LICENSE.txt", "LICENSE.md", "LICENSE-MIT", "LICENSE-APACHE"] : ["LICENSE", "LICENSE.txt", "LICENSE.md", "LICENSE-MIT", "LICENSE-APACHE"];
  for (const name of names) {
    const path = join(clone, name);
    if (existsSync(path) && statSync(path).isFile()) return path;
  }
  return undefined;
}

function licenseNotice(path) {
  const text = readFileSync(path, "utf8");
  // Only a real notice ("Copyright (c) 2025 Name"), never boilerplate such as Apache-2.0's own wording.
  const copyright = text.split(/\r?\n/u).find((line) => /^\s*copyright\s*(\(c\)|©)?\s*\d{4}/iu.test(line))?.trim();
  return { text, copyright };
}

function sourceNote({ source, relPath, sha, date, copyright, dropped }) {
  return [
    "# Source",
    "",
    `Unmodified copy of \`${relPath}\` from ${source.repo}`,
    `at commit ${sha} (${date}), under the ${source.spdx} licence.`,
    ...(copyright ? ["", copyright] : []),
    "",
    "The licence text is in LICENSE.txt. Nothing in this folder was edited.",
    ...(dropped?.length
      ? [
          "",
          `The ${dropped.map((folder) => `\`${folder}/\``).join(" and ")} folder${dropped.length > 1 ? "s were" : " was"} left out: it holds code the store does not carry, and this Skill's own text does not point at ${dropped.length > 1 ? "them" : "it"}. Everything else is the upstream copy, word for word.`,
        ]
      : []),
    "",
  ].join("\n");
}

const args = process.argv.slice(2);
const workIndex = args.indexOf("--work");
if (workIndex < 0 || !args[workIndex + 1]) die("usage: vendor.mjs --work <dir with the clones>");
const work = resolve(args[workIndex + 1]);
const manifest = JSON.parse(readFileSync(join(ROOT, "sources.json"), "utf8"));
if (manifest.schema !== "alran.store.vendor/v1") die("sources.json: unknown schema");

const reserved = new Set(manifest.reservedNames ?? []);
const fatal = [];
const excluded = [];
const notices = [];
const taken = new Map();
const staged = [];
const trimmed = [];
const frozen = new Set();

for (const source of manifest.sources) {
  // A frozen source is one whose upstream repository is gone: the Skills that were taken from it
  // stay in the store as they were taken. Nothing is copied and no clone is needed, so the source
  // cannot be checked or refreshed; it keeps the version and the licence it was taken under.
  if (source.frozen) {
    const vendored = join(ROOT, "skills", source.id);
    if (!existsSync(vendored)) die(`${source.id}: frozen, but there are no vendored Skills`);
    const folders = readdirSync(vendored, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    const licensed = folders.find((entry) => existsSync(join(vendored, entry.name, "LICENSE.txt")));
    if (!licensed) die(`${source.id}: frozen, but no vendored Skill carries a LICENSE.txt`);
    const licenseText = readFileSync(join(vendored, licensed.name, "LICENSE.txt"), "utf8");
    notices.push({ source, licenseText, sha: source.commit, date: source.frozen.date, copyright: source.frozen.copyright, count: folders.length });
    frozen.add(source.id);
    continue;
  }
  const clone = join(work, source.clone);
  if (!existsSync(join(clone, ".git"))) die(`${source.id}: no clone at ${clone}`);
  const sha = git(clone, "rev-parse", "HEAD");
  if (sha !== source.commit) die(`${source.id}: the clone is at ${sha}, sources.json pins ${source.commit}`);
  if (git(clone, "status", "--porcelain")) die(`${source.id}: the clone has local changes`);
  const date = git(clone, "log", "-1", "--format=%cs");
  const licensePath = licenseFile(clone, source.licenseFile);
  if (!licensePath) die(`${source.id}: ${clone} has no LICENSE, LICENSE.txt or LICENSE.md`);
  const { text: licenseText, copyright } = licenseNotice(licensePath);

  // Candidates: folder name -> every directory that holds a Skill of that name, from every skills
  // directory of the source. A source may ship the same Skill twice (a plugin bundle next to the
  // copy it was built from): the first copy that is admitted is taken, the others are left out and
  // listed in EXCLUDED.md.
  const dirs = source.skillsDirs ?? [source.skillsDir];
  const candidates = new Map();
  for (const dir of dirs) {
    const base = join(clone, dir);
    if (!existsSync(base)) die(`${source.id}: ${dir} does not exist`);
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory() || !existsSync(join(base, entry.name, "SKILL.md"))) continue;
      const found = candidates.get(entry.name) ?? [];
      found.push({ directory: join(base, entry.name), relPath: `${dir}/${entry.name}` });
      candidates.set(entry.name, found);
    }
  }
  const named = source.skills !== undefined;
  if (named === (source.include === "clean")) die(`${source.id}: give either "skills" or "include": "clean"`);
  const wanted = named ? source.skills : [...candidates.keys()].filter((name) => !(source.exclude ?? []).includes(name));
  const members = new Map();
  for (const name of [...new Set(wanted)].sort()) {
    const found = candidates.get(name);
    if (!found) {
      fatal.push(`${source.id}/${name}: not found in ${dirs.join(", ")}`);
      continue;
    }
    const evaluated = found.map((candidate) => {
      const { reasons, dropped } = admitWithoutCode(candidate.directory, name);
      if (reserved.has(name)) reasons.push("the name belongs to a Skill built in to Alran Code");
      return { candidate: { ...candidate, dropped }, reasons };
    });
    const passing = evaluated.filter((entry) => entry.reasons.length === 0);
    let chosen;
    if (named) {
      // a named Skill has to be admitted in every copy the source ships of it
      const failing = evaluated.find((entry) => entry.reasons.length > 0);
      if (failing) {
        fatal.push(`${source.id}/${name}: ${failing.reasons.join("; ")}`);
        continue;
      }
      chosen = passing[0]?.candidate;
    } else {
      for (const entry of evaluated) {
        if (entry.reasons.length > 0) excluded.push({ source, name, reasons: entry.reasons });
      }
      if (passing.length === 0) continue;
      chosen = passing[0].candidate;
      // the store holds one copy of a Skill: any further copy of it is left out
      for (const entry of evaluated.slice(evaluated.indexOf(passing[0]) + 1)) {
        excluded.push({ source, name, reasons: [`another copy of this Skill in this source (${entry.candidate.relPath}) was left out; the store holds one copy`] });
      }
    }
    if (taken.has(name)) {
      if (named) fatal.push(`${name} is in both ${taken.get(name)} and ${source.id}`);
      else excluded.push({ source, name, reasons: [`the name is already taken by ${taken.get(name)}`] });
      continue;
    }
    members.set(name, chosen);
  }

  // Links that leave a Skill must land on another Skill of this source (or a shared folder) that is in.
  const sharedRoots = (source.shared ?? []).map((shared) => resolve(clone, shared.from));
  for (let changed = true; changed; ) {
    changed = false;
    for (const [name, candidate] of [...members]) {
      const dangling = outwardLinks(candidate.directory, candidate.dropped).filter(({ target }) => {
        if (sharedRoots.some((root) => target === root || target.startsWith(root + sep))) return false;
        return ![...members.values()].some((member) => target === member.directory || target.startsWith(member.directory + sep));
      });
      if (dangling.length === 0) continue;
      const reason = `links to ${[...new Set(dangling.map(({ link }) => link))].slice(0, 3).join(", ")}, which is not in the store`;
      if (named) fatal.push(`${source.id}/${name}: ${reason}`);
      else excluded.push({ source, name, reasons: [reason] });
      members.delete(name);
      changed = true;
    }
  }
  for (const [name, candidate] of members) {
    taken.set(name, source.id);
    staged.push({ kind: "skill", source, name, directory: candidate.directory, to: join(ROOT, "skills", source.id, name), relPath: candidate.relPath, sha, date, copyright, licenseText, dropped: candidate.dropped ?? [] });
    if (candidate.dropped?.length) {
      trimmed.push({ source, name, folders: candidate.dropped });
    }
  }
  for (const shared of source.shared ?? []) {
    const directory = join(clone, shared.from);
    if (!existsSync(directory) || !statSync(directory).isDirectory()) {
      fatal.push(`${source.id}: shared directory ${shared.from} is missing`);
      continue;
    }
    const reasons = [];
    listFiles(directory, reasons);
    if (reasons.length > 0) fatal.push(`${source.id}/${shared.from}: ${reasons.join("; ")}`);
    staged.push({ kind: "shared", source, name: shared.from, directory, to: join(ROOT, "shared", source.id, shared.to), relPath: shared.from, sha, date, copyright, licenseText });
  }
  notices.push({ source, licenseText, sha, date, copyright, count: members.size });
}
if (fatal.length > 0) die(`refused:\n${fatal.map((line) => `  ${line}`).join("\n")}`);

for (const id of new Set(manifest.sources.map((source) => source.id))) {
  if (frozen.has(id)) continue; // the vendored Skills of a frozen source stay as they are
  rmSync(join(ROOT, "skills", id), { recursive: true, force: true });
  rmSync(join(ROOT, "shared", id), { recursive: true, force: true });
}
for (const item of staged) {
  mkdirSync(dirname(item.to), { recursive: true });
  const dropped = new Set(item.dropped ?? []);
  cpSync(item.directory, item.to, {
    recursive: true,
    filter: (path) => {
      if (path === item.directory) return true;
      const parts = path.slice(item.directory.length + 1).split(sep);
      if (dropped.has(parts[0])) return false;
      return !parts.some((part) => part === ".git" || part === "node_modules" || JUNK.has(part));
    },
  });
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
  ...notices.map(({ source, sha, date, count }) => `| ${source.label} | ${source.repo} | ${sha.slice(0, 7)} (${date}) | ${source.spdx} | ${count} |`),
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
  lines.push(`### ${source.spdx}: ${[...new Set(users)].join(", ")}`, "", ...(copyright ? [copyright, ""] : []), "```text", licenseText.trim(), "```", "");
}
// The block scripts/vendor-package.mjs writes for the Plugin packages survives this rewrite.
const noticesFile = join(ROOT, "THIRD_PARTY_NOTICES.md");
const previousNotices = existsSync(noticesFile) ? readFileSync(noticesFile, "utf8") : "";
const packagesBlock = /<!-- packages:begin -->[\s\S]*?<!-- packages:end -->\n?/u.exec(previousNotices)?.[0];
writeFileSync(noticesFile, `${lines.join("\n")}${packagesBlock ? `\n${packagesBlock}` : ""}`);

const grouped = new Map();
for (const entry of excluded) grouped.set(entry.source.id, [...(grouped.get(entry.source.id) ?? []), entry]);
writeFileSync(
  join(ROOT, "EXCLUDED.md"),
  [
    "# Left out by the admission rules",
    "",
    "Skills of an \"all clean\" source that `scripts/vendor.mjs` did not take, and why. Generated; do not edit.",
    "",
    ...[...grouped.entries()].flatMap(([id, entries]) => [
      `## ${id} (${entries.length})`,
      "",
      ...entries.map(({ name, reasons }) => `- \`${name}\`: ${reasons.join("; ")}`),
      "",
    ]),
    ...(trimmed.length
      ? [
          "## Left out of a vendored Skill",
          "",
          "These Skills are in the store, but without the folder named here: it holds code the store does",
          "not carry, and the Skill's own text never points at it. Every other file is the upstream copy.",
          "",
          ...trimmed.map(({ source, name, folders }) => `- \`${source.id}/${name}\`: ${folders.map((folder) => `\`${folder}/\``).join(", ")}`),
          "",
        ]
      : []),
  ].join("\n"),
);

const versions = Object.fromEntries(notices.map(({ source, sha, date }) => [source.id, `${date.split("-").map(Number).join(".")}+${sha.slice(0, 7)}`]));
const counts = Object.fromEntries(notices.map(({ source, count }) => [source.id, count]));
writeFileSync(join(ROOT, "versions.json"), `${JSON.stringify({ versions, counts }, null, 2)}\n`);
console.log(`vendored ${staged.filter((item) => item.kind === "skill").length} skills from ${manifest.sources.length} sources; left out ${excluded.length} (EXCLUDED.md)`);
console.log(`frozen sources (upstream gone): ${[...frozen].join(", ") || "none"}`);
console.log("versions and counts written to versions.json (scripts/gen-config.mjs reads them)");
