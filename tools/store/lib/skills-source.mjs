// Reads the Skills of a skills repository (a folder per Skill with a SKILL.md) for the store
// builder: which Skills exist, their metadata, and the exact files each one consists of.

import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SEGMENT = /^[A-Za-z0-9._-]+$/u;
const WINDOWS_RESERVED = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/iu;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
// Build leftovers that are never part of a Skill.
const JUNK_DIRECTORIES = new Set(["__pycache__", ".git", "node_modules", ".pytest_cache", ".mypy_cache"]);
const JUNK_FILES = /^(?:\.DS_Store|Thumbs\.db|.*\.pyc|.*\.pyo)$/u;
const MAX_FILE_BYTES = 16 * 1024 * 1024;

/** `name`, `description` and `version` of a SKILL.md: plain, quoted, folded and literal scalars. */
export function parseFrontmatter(text) {
  if (text.charCodeAt(0) === 0xfeff) throw new Error("starts with a byte order mark");
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
  if (!match) throw new Error("has no YAML frontmatter");
  const fields = new Map();
  const lines = match[1].split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const field = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/u.exec(lines[index]);
    if (!field) continue;
    let value = field[2].trim();
    if (/^[|>][+-]?$/u.test(value)) {
      const folded = value.startsWith(">");
      const body = [];
      while (index + 1 < lines.length && /^(\s+|$)/u.test(lines[index + 1])) {
        index += 1;
        body.push(lines[index].trim());
      }
      value = body.join(folded ? " " : "\n").trim();
    } else if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value.slice(1, -1);
      }
    } else if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
      value = value.slice(1, -1).replace(/''/gu, "'");
    } else if (value === "") {
      const body = [];
      while (index + 1 < lines.length && /^\s+\S/u.test(lines[index + 1])) {
        index += 1;
        body.push(lines[index].trim());
      }
      value = body.join(" ");
    }
    if (!fields.has(field[1])) fields.set(field[1], value);
  }
  return fields;
}

function titleCase(name) {
  return name
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function listSkillFiles(directory, root, problems) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    const info = lstatSync(full);
    if (info.isSymbolicLink()) {
      problems.push(`${relative(root, full)} is a symlink`);
      continue;
    }
    if (info.isDirectory()) {
      if (JUNK_DIRECTORIES.has(entry.name)) continue;
      files.push(...listSkillFiles(full, root, problems));
      continue;
    }
    if (!info.isFile()) {
      problems.push(`${relative(root, full)} is not a regular file`);
      continue;
    }
    if (JUNK_FILES.test(entry.name)) continue;
    const path = relative(root, full).split(sep).join("/");
    const segments = path.split("/");
    if (segments.length > 14) problems.push(`${path} is nested too deeply`);
    for (const segment of segments) {
      if (!SEGMENT.test(segment) || segment.endsWith(".") || WINDOWS_RESERVED.test(segment)) {
        problems.push(`${path} is not a portable file name`);
        break;
      }
    }
    if (info.size > MAX_FILE_BYTES) problems.push(`${path} is larger than 16 MiB`);
    files.push({ path, content: readFileSync(full) });
  }
  return files;
}

/**
 * The Skills of `sourceRoot`. `catalog.json` (when present) says which folders are Skills and
 * gives their title and group; otherwise every folder holding a SKILL.md two levels down counts.
 * Returns `{ skills, problems }`; a Skill with a problem is not in `skills`.
 */
export function readSkills(sourceRoot, options = {}) {
  const exclude = new Set(options.exclude ?? []);
  const titles = options.titles ?? {};
  const groups = options.groups ?? {};
  const versions = options.versions ?? {};
  const problems = [];
  const candidates = [];
  const catalogPath = join(sourceRoot, "catalog.json");
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    for (const skill of catalog.skills ?? []) {
      candidates.push({ name: skill.name, path: skill.path, package: skill.package, title: skill.title });
    }
  } else {
    const base = join(sourceRoot, "skills");
    for (const group of readdirSync(base, { withFileTypes: true })) {
      if (!group.isDirectory()) continue;
      for (const skill of readdirSync(join(base, group.name), { withFileTypes: true })) {
        if (skill.isDirectory() && existsSync(join(base, group.name, skill.name, "SKILL.md"))) {
          candidates.push({ name: skill.name, path: `skills/${group.name}/${skill.name}`, package: group.name });
        }
      }
    }
  }
  const skills = [];
  for (const candidate of candidates) {
    if (exclude.has(candidate.name)) continue;
    const directory = join(sourceRoot, candidate.path);
    const found = [];
    if (!SKILL_NAME.test(candidate.name)) found.push(`"${candidate.name}" is not a Skill name`);
    if (!existsSync(join(directory, "SKILL.md"))) found.push("has no SKILL.md");
    let front;
    if (found.length === 0) {
      try {
        front = parseFrontmatter(readFileSync(join(directory, "SKILL.md"), "utf8"));
      } catch (error) {
        found.push(`SKILL.md ${error.message}`);
      }
    }
    if (front) {
      if (front.get("name") !== candidate.name) {
        found.push(`SKILL.md names "${front.get("name")}", the folder is "${candidate.name}"`);
      }
      if (!front.get("description")) found.push("SKILL.md has no description");
    }
    const files = found.length === 0 ? listSkillFiles(directory, directory, found) : [];
    if (found.length > 0) {
      problems.push(...found.map((problem) => `${candidate.name}: ${problem}`));
      continue;
    }
    const declared = front.get("version");
    // A version the config names for the whole group wins: a vendored group has one upstream commit.
    const version = versions[candidate.package] ?? (declared && SEMVER.test(declared) ? declared : "1.0.0");
    if (!SEMVER.test(version)) {
      problems.push(`${candidate.name}: version "${version}" is not SemVer`);
      continue;
    }
    skills.push({
      name: candidate.name,
      title: titles[candidate.name] ?? (candidate.title && candidate.title !== titleCase(candidate.name) ? candidate.title : titleCase(candidate.name)),
      description: front.get("description").replace(/\s+/gu, " ").trim(),
      version,
      group: groups[candidate.package] ?? titleCase(candidate.package),
      package: candidate.package,
      license: front.get("license") || undefined,
      files,
    });
  }
  skills.sort((left, right) => (left.name < right.name ? -1 : 1));
  return { skills, problems };
}
