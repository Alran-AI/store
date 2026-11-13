#!/usr/bin/env node
// Copies a Plugin that carries scripts or a hook from a local clone into packages/<id>/, and writes its
// manifest, its hook registration, SOURCE.md and PATCHES.md. Unlike scripts/vendor.mjs this takes files that
// are not plain text, so it is stricter in another way: every upstream file is pinned by SHA-256 in
// packages.json. The scripts and the hook were read line by line, the Skill text is checked by rules; a
// file that differs, appears or disappears upstream stops the run, and after reading the change --pin
// accepts it.
//
//   node scripts/vendor-package.mjs --work <dir with the clones> [--pin]
//
// Like vendor.mjs it only reads the clone; it never runs anything from it. Order of a full refresh:
//   vendor.mjs, vendor-package.mjs, gen-icons.mjs, gen-config.mjs, build-store.mjs.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SEGMENT = /^[A-Za-z0-9._-]+$/u;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const NOTICES = "THIRD_PARTY_NOTICES.md";
const BEGIN = "<!-- packages:begin -->";
const END = "<!-- packages:end -->";
const INVISIBLE = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]|[\u{e0000}-\u{e007f}]/u;
const DATA_URI = /data:[a-z]+\/[a-z0-9.+-]+;base64,/iu;
const OVERRIDE = /ignore (all )?(previous|prior) instructions/iu;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function die(message) {
  console.error(`vendor-package: ${message}`);
  process.exit(1);
}

const git = (clone, ...args) => execFileSync("git", ["-C", clone, ...args], { encoding: "utf8" }).trim();

/** Every regular file under `directory` (relative, "/"-separated, sorted); a symlink stops the run. */
function listFiles(base, relative) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(join(base, current), { withFileTypes: true })) {
      const path = current ? posix.join(current, entry.name) : entry.name;
      const stat = lstatSync(join(base, path));
      if (stat.isSymbolicLink()) die(`${path} is a symbolic link`);
      if (stat.isDirectory()) walk(path);
      else if (stat.isFile()) out.push(path);
    }
  };
  if (!existsSync(join(base, relative))) die(`${relative} does not exist in the clone`);
  if (lstatSync(join(base, relative)).isFile()) return [relative];
  walk(relative);
  return out.sort();
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/u.exec(text);
  const field = (name) => {
    const line = match && new RegExp(`^${name}\\s*:\\s*(.+)$`, "mu").exec(match[1]);
    return line ? line[1].trim().replace(/^["']|["']$/gu, "") : undefined;
  };
  return { name: field("name"), description: field("description") };
}

const args = process.argv.slice(2);
const workIndex = args.indexOf("--work");
if (workIndex < 0 || !args[workIndex + 1]) die("usage: vendor-package.mjs --work <dir with the clones> [--pin]");
const work = resolve(args[workIndex + 1]);
const pinning = args.includes("--pin");
const manifestPath = join(ROOT, "packages.json");
const document = JSON.parse(readFileSync(manifestPath, "utf8"));
if (document.schema !== "alran.store.packages/v1") die("packages.json: unknown schema");

const noticeSections = [];
for (const pkg of document.packages) {
  const clone = join(work, pkg.clone);
  if (!existsSync(join(clone, ".git"))) die(`${clone} is not a clone (git clone ${pkg.repo} ${clone})`);
  const head = git(clone, "rev-parse", "HEAD");
  if (head !== pkg.commit) die(`${pkg.id}: the clone is at ${head}, packages.json pins ${pkg.commit}; check it out`);
  const date = git(clone, "show", "-s", "--format=%cs", head);
  const version = `${date.split("-").map(Number).join(".")}+${head.slice(0, 7)}`;

  // The upstream files this package takes.
  const omitted = (path) => pkg.omit.some((entry) => path === entry.path || path.startsWith(`${entry.path}/`));
  const taken = [];
  for (const rule of pkg.copy) {
    for (const path of listFiles(clone, rule.from)) {
      if (omitted(path)) continue;
      const to = rule.from === path ? rule.to : posix.join(rule.to, path.slice(rule.from.length + 1));
      taken.push({ from: path, to });
    }
  }
  for (const entry of taken) {
    for (const segment of entry.to.split("/")) if (!SEGMENT.test(segment)) die(`${pkg.id}: ${entry.to} is not a portable file name`);
    entry.bytes = readFileSync(join(clone, ...entry.from.split("/")));
    entry.sha256 = sha256(entry.bytes);
  }
  const licenseBytes = readFileSync(join(clone, "LICENSE"));
  const licenseText = licenseBytes.toString("utf8");
  // Upstream's package.json is not copied (it configures other tools too); its name and version are read.
  const upstreamPackageBytes = pkg.packageJson ? readFileSync(join(clone, pkg.packageJson)) : undefined;

  // The pins.
  const found = Object.fromEntries(taken.map((entry) => [entry.from, entry.sha256]));
  if (upstreamPackageBytes) found[pkg.packageJson] = sha256(upstreamPackageBytes);
  if (pinning) {
    pkg.pins = { ...found, LICENSE: sha256(licenseBytes) };
    writeFileSync(manifestPath, json(document));
    console.log(`${pkg.id}: pinned ${Object.keys(pkg.pins).length} files at ${head.slice(0, 7)}`);
  } else {
    const pins = pkg.pins ?? {};
    const expected = { ...found, LICENSE: sha256(licenseBytes) };
    const problems = [];
    for (const [path, hash] of Object.entries(expected)) {
      if (!(path in pins)) problems.push(`new, not read yet: ${path}`);
      else if (pins[path] !== hash) problems.push(`changed since it was read: ${path}`);
    }
    for (const path of Object.keys(pins)) if (!(path in expected)) problems.push(`gone: ${path}`);
    if (problems.length > 0) {
      die(`${pkg.id}: upstream differs from what was read:\n${problems.map((line) => `  ${line}`).join("\n")}\nRead the difference, then run again with --pin.`);
    }
  }

  // Patches: exact text, exactly once.
  for (const patch of pkg.patches) {
    const entry = taken.find((candidate) => candidate.to === patch.file);
    if (!entry) die(`${pkg.id}: patch for ${patch.file}, which the package does not take`);
    const text = entry.bytes.toString("utf8");
    const count = text.split(patch.find).length - 1;
    if (count !== 1) die(`${pkg.id}: the text to replace in ${patch.file} occurs ${count} times, not once`);
    entry.bytes = Buffer.from(text.replace(patch.find, () => patch.replace), "utf8");
  }

  // The Skills, and the rules every Skill of a package has to meet.
  const skills = [];
  const problems = [];
  for (const entry of taken) {
    const parts = entry.to.split("/");
    if (parts[0] === "skills" && parts.length === 3 && parts[2] === "SKILL.md") {
      const { name, description } = frontmatter(entry.bytes.toString("utf8"));
      if (name !== parts[1] || !SKILL_NAME.test(name ?? "")) problems.push(`${entry.to}: the name "${name}" is not its folder`);
      if (!description) problems.push(`${entry.to}: no description`);
      skills.push(parts[1]);
    }
    if (entry.to.endsWith(".md")) {
      const text = entry.bytes.toString("utf8");
      if (INVISIBLE.test(text)) problems.push(`${entry.to}: contains invisible characters`);
      if (DATA_URI.test(text)) problems.push(`${entry.to}: embeds a data URI`);
      if (OVERRIDE.test(text)) problems.push(`${entry.to}: contains an instruction-override phrase`);
    }
  }
  const skillSet = new Set(skills);
  // `superpowers:<name>` has to name a Skill this package carries.
  for (const entry of taken) {
    if (!/\.(md|cjs|js|ts|sh|html|dot)$/u.test(entry.to) && !entry.to.startsWith("hooks/")) continue;
    for (const match of entry.bytes.toString("utf8").matchAll(new RegExp(`${pkg.name}:([a-z][a-z0-9-]*)`, "gu"))) {
      if (!skillSet.has(match[1])) problems.push(`${entry.to}: refers to ${pkg.name}:${match[1]}, which the package does not carry`);
    }
  }
  if (problems.length > 0) die(`${pkg.id}:\n${[...new Set(problems)].map((line) => `  ${line}`).join("\n")}`);

  // Write packages/<id>/. icon.png is made by gen-icons.mjs and kept.
  const out = join(ROOT, "packages", pkg.id);
  const icon = existsSync(join(out, "icon.png")) ? readFileSync(join(out, "icon.png")) : undefined;
  rmSync(out, { recursive: true, force: true });
  const put = (path, bytes) => {
    const target = join(out, ...path.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  };
  for (const entry of taken) put(entry.to, entry.bytes);
  put("LICENSE", licenseBytes);
  put("hooks/hooks.json", json({ hooks: pkg.hooks }));
  if (upstreamPackageBytes) {
    const upstream = JSON.parse(upstreamPackageBytes.toString("utf8"));
    put("package.json", json({ name: upstream.name, version: upstream.version, type: "module", private: true }));
  }
  const sortedSkills = [...skills].sort();
  put(
    ".alran-plugin/plugin.json",
    json({
      schemaVersion: 1,
      name: pkg.name,
      version,
      displayName: pkg.displayName,
      description: pkg.description,
      author: pkg.author,
      icon: "icon.png",
      category: pkg.category,
      exampleQueries: pkg.exampleQueries,
      apps: [],
      mcpServers: [],
      skills: sortedSkills.map((name) => `skills/${name}/SKILL.md`),
      hooks: ["hooks/hooks.json"],
    }),
  );
  if (icon) put("icon.png", icon);
  const copyright = licenseText.split(/\r?\n/u).find((line) => /^\s*copyright\s*(\(c\)|©)?\s*\d{4}/iu.test(line))?.trim();
  put(
    "SOURCE.md",
    [
      "# Source",
      "",
      `Copy of \`skills/\`, \`hooks/session-start\` and \`hooks/run-hook.cmd\` from ${pkg.repo}`,
      `at commit ${head} (${date}), under the ${pkg.license} licence.`,
      ...(copyright ? ["", copyright] : []),
      "",
      "The licence text is in LICENSE. This copy is not entirely unmodified: PATCHES.md lists every",
      "difference, and everything it does not list is byte-for-byte what upstream has at that commit.",
      "",
    ].join("\n"),
  );
  put(
    "PATCHES.md",
    [
      "# What differs from upstream",
      "",
      `Upstream: ${pkg.repo} at ${head.slice(0, 7)}. Every other file of this package is identical to upstream;`,
      "`scripts/vendor-package.mjs` in the Alran store repository pins the SHA-256 of each one and stops when an",
      "upstream file is not the one that was read.",
      "",
      "## Left out",
      "",
      ...pkg.omit.map((entry) => `- \`${entry.path}\`: ${entry.reason}`),
      "",
      "## Changed",
      "",
      ...pkg.patches.flatMap((patch) => [`- \`${patch.file}\`: ${patch.reason}`, "", "  ```diff", `  - ${patch.find}`, `  + ${patch.replace}`, "  ```", ""]),
      "## Written for Alran",
      "",
      `- \`hooks/hooks.json\`: ${pkg.hooksReason}`,
      ...(upstreamPackageBytes
        ? ["- `package.json`: upstream's name and version with `\"type\": \"module\"` and nothing else. The brainstorm server shows this version in its page header, and `skills/writing-skills/render-graphs.js` is written as an ES module."]
        : []),
      "- `.alran-plugin/plugin.json`, `icon.png`, `SOURCE.md` and this file.",
      "",
      "## Limits of an archive",
      "",
      "An Alran Plugin archive does not keep the executable bit. The Skills call their scripts through `bash`",
      "or `node`, as upstream's own text asks; where a Skill names a script by its bare path (the",
      "`executing-plans` Skill does), run it as `bash <path>`.",
      "",
    ].join("\n"),
  );

  const hookCount = Object.values(pkg.hooks).reduce((sum, groups) => sum + groups.reduce((n, group) => n + group.hooks.length, 0), 0);
  console.log(`${pkg.id} ${version}: ${taken.length} upstream files (${skills.length} Skills, ${pkg.patches.length} patch, ${pkg.omit.length} left out), ${hookCount} hook`);
  noticeSections.push({ pkg, head, date, copyright, licenseText });
}

// The packages' part of THIRD_PARTY_NOTICES.md: a block vendor.mjs keeps when it rewrites the file.
const block = [
  BEGIN,
  "## Plugin packages",
  "",
  "These Plugins are redistributed as packages. Each carries its licence as `LICENSE` and lists its",
  "differences from upstream in `PATCHES.md`. Generated by `scripts/vendor-package.mjs`.",
  "",
  "| Package | Repository | Commit | Licence |",
  "| --- | --- | --- | --- |",
  ...noticeSections.map(({ pkg, head, date }) => `| ${pkg.displayName} | ${pkg.repo} | ${head.slice(0, 7)} (${date}) | ${pkg.license} |`),
  "",
  ...noticeSections.flatMap(({ pkg, copyright, licenseText }) => [
    `### ${pkg.license}: ${pkg.repo.replace("https://github.com/", "")}`,
    "",
    ...(copyright ? [copyright, ""] : []),
    "```text",
    licenseText.trim(),
    "```",
    "",
  ]),
  END,
  "",
].join("\n");
const noticesFile = join(ROOT, NOTICES);
const previous = existsSync(noticesFile) ? readFileSync(noticesFile, "utf8") : "";
const start = previous.indexOf(BEGIN);
const finish = previous.indexOf(END);
const kept = start >= 0 && finish > start;
const before = kept ? previous.slice(0, start) : previous.replace(/\s*$/u, "\n\n");
const after = kept ? previous.slice(finish + END.length).replace(/^\n/u, "") : "";
writeFileSync(noticesFile, `${before}${block}${after}`);
console.log(`${NOTICES}: packages block written`);
