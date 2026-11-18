#!/usr/bin/env node
// Builds an Alran Store (docs/store/index-format-v1.md) from a skills repository.
//
//   node tools/store/build-store.mjs --source <skills-repo> [--config <file>] [--out <dir>] [--check]
//
// Reads every Skill of <skills-repo> and the Plugin definitions of the config
// (<skills-repo>/store/store.config.json by default), and writes <out>/index.json plus one
// deterministic archive per Skill and per Plugin under <out>/archives/. The output is a pure
// function of the inputs: the same repository always produces the same bytes, so `--check`
// (build in memory, compare with <out>, exit 1 on any difference) can gate a CI run.
//
// A Plugin is either a bundle (a list of the repository's Skills assembled into a package) or a
// ready-made package directory. Every assembled Plugin passes the public Plugin validator
// (tools/plugins/validate-plugin.mjs) before it is archived.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { validatePlugin } from "../plugins/validate-plugin.mjs";
import { buildArchive, contentDigest, sha256Hex } from "./lib/package-archive.mjs";
import { parseFrontmatter, readSkills } from "./lib/skills-source.mjs";

const CATEGORIES = [
  "Office",
  "Studio",
  "Design & Sites",
  "Code",
  "Business",
  "Sales",
  "Productivity",
  "Science & Healthcare",
  "Education",
  "Other",
];
const PLUGIN_NAME = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;
const SEMVER = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;

function fail(message) {
  const error = new Error(message);
  error.expected = true;
  return error;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw fail(`${file}: ${error.message}`);
  }
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function listTree(root) {
  const files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        files.push({ path: relative(root, full).split(sep).join("/"), content: readFileSync(full) });
      }
    }
  };
  walk(root);
  return files;
}

function materialize(files, directory) {
  for (const file of files) {
    const target = join(directory, ...file.path.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content);
  }
}

/** Assembles a bundle definition into the files of a Plugin package. */
function assembleBundle(definition, skillsByName, skillsByPackage, configDirectory, sourceRoot) {
  const names = new Set(definition.skills ?? []);
  for (const pkg of definition.packages ?? []) {
    const members = skillsByPackage.get(pkg);
    if (!members) throw fail(`plugin "${definition.name}": no Skills in package "${pkg}"`);
    for (const skill of members) names.add(skill.name);
  }
  if (names.size === 0) throw fail(`plugin "${definition.name}": a bundle needs skills or packages`);
  const files = [];
  const chosen = [...names].sort();
  for (const name of chosen) {
    const skill = skillsByName.get(name);
    if (!skill) throw fail(`plugin "${definition.name}": Skill "${name}" is not in the library`);
    for (const file of skill.files) files.push({ path: `skills/${name}/${file.path}`, content: file.content });
  }
  // Files a package needs beyond its Skills, for example checklists its Skills link to.
  for (const entry of definition.directories ?? []) {
    const directory = resolve(sourceRoot, entry.from ?? "");
    if (!entry.to || !existsSync(directory) || !statSync(directory).isDirectory()) {
      throw fail(`plugin "${definition.name}": directory "${entry.from}" does not exist in the source`);
    }
    for (const file of listTree(directory)) files.push({ path: `${entry.to}/${file.path}`, content: file.content });
  }
  for (const entry of definition.files ?? []) {
    const file = resolve(sourceRoot, entry.from ?? "");
    if (!entry.to || !existsSync(file) || !statSync(file).isFile()) {
      throw fail(`plugin "${definition.name}": file "${entry.from}" does not exist in the source`);
    }
    files.push({ path: entry.to, content: readFileSync(file) });
  }
  const iconSource = resolve(configDirectory, definition.icon ?? "");
  if (!definition.icon || !existsSync(iconSource)) {
    throw fail(`plugin "${definition.name}": icon "${definition.icon}" does not exist next to the config`);
  }
  const iconExtension = definition.icon.split(".").pop();
  files.push({ path: `icon.${iconExtension}`, content: readFileSync(iconSource) });
  const manifest = {
    schemaVersion: 1,
    name: definition.name,
    version: definition.version,
    displayName: definition.displayName,
    description: definition.description,
    author: definition.author,
    icon: `icon.${iconExtension}`,
    category: definition.category,
    exampleQueries: definition.exampleQueries ?? [],
    apps: [],
    mcpServers: [],
    skills: chosen.map((name) => `skills/${name}/SKILL.md`),
  };
  files.push({ path: ".alran-plugin/plugin.json", content: jsonBytes(manifest) });
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file.path)) throw fail(`plugin "${definition.name}": ${file.path} is listed twice`);
    seen.add(file.path);
  }
  return { files, manifest };
}

function describeContents(files, manifest) {
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  const skills = manifest.skills.map((reference) => {
    const name = reference.split("/")[1];
    const description = parseFrontmatter(byPath.get(reference).toString("utf8")).get("description");
    return { name, ...(description ? { description: description.replace(/\s+/gu, " ").trim() } : {}) };
  });
  const mcpServers = [];
  for (const reference of manifest.mcpServers ?? []) {
    mcpServers.push(...Object.keys(JSON.parse(byPath.get(reference).toString("utf8")).mcpServers));
  }
  const apps = [];
  for (const reference of manifest.apps ?? []) {
    apps.push(JSON.parse(byPath.get(reference).toString("utf8")).provider);
  }
  let hooks = 0;
  for (const reference of manifest.hooks ?? []) {
    const document = JSON.parse(byPath.get(reference).toString("utf8"));
    for (const groups of Object.values(document.hooks ?? {})) {
      for (const group of groups) {
        hooks += (group.hooks ?? []).filter((handler) => handler.type === "command").length;
      }
    }
  }
  return { skills, mcpServers, apps, hooks };
}

function checkPlugin(definition) {
  const where = `plugin "${definition.name ?? "?"}"`;
  if (!PLUGIN_NAME.test(definition.name ?? "")) throw fail(`${where}: bad name`);
  if (!SEMVER.test(definition.version ?? "")) throw fail(`${where}: version must be SemVer`);
  if (!CATEGORIES.includes(definition.category)) throw fail(`${where}: category must be one of ${CATEGORIES.join(", ")}`);
  for (const key of ["displayName", "description", "author"]) {
    if (typeof definition[key] !== "string" || !definition[key].trim()) throw fail(`${where}: ${key} is required`);
  }
  if ((definition.exampleQueries ?? []).length > 3) throw fail(`${where}: at most 3 exampleQueries`);
}

function validateAssembled(definition, files) {
  const directory = mkdtempSync(join(tmpdir(), "alran-store-validate-"));
  try {
    const root = join(directory, definition.name);
    materialize(files, root);
    const { failures } = validatePlugin(root);
    if (failures.length > 0) {
      throw fail(
        `plugin "${definition.name}" fails the Plugin validator:\n` +
          failures.map(({ code, detail }) => `  ${code}: ${detail}`).join("\n"),
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/** A version as it appears in a file name: build metadata's "+" is not friendly to every proxy. */
const inFileName = (version) => version.replaceAll("+", "-");

function archiveRef(files, fileName) {
  const archive = buildArchive(files);
  if (archive.length > MAX_ARCHIVE_BYTES) throw fail(`${fileName} is larger than the 64 MiB archive limit`);
  return {
    bytes: archive,
    ref: {
      url: `archives/${fileName}`,
      size: archive.length,
      archiveSha256: sha256Hex(archive),
      contentDigest: contentDigest(files),
    },
  };
}

/** Builds the whole store in memory: `{ files: Map<relativePath, Buffer>, summary }`. */
export function buildStore({ source, config: configPath }) {
  const sourceRoot = resolve(source);
  const configFile = resolve(configPath ?? join(sourceRoot, "store", "store.config.json"));
  const configDirectory = dirname(configFile);
  const config = readJson(configFile);
  if (config.schema !== "alran.store.build/v1") throw fail(`${configFile}: schema must be "alran.store.build/v1"`);
  const { skills, problems } = readSkills(sourceRoot, {
    exclude: (config.skills?.exclude ?? []).map((entry) => (typeof entry === "string" ? entry : entry.name)),
    titles: config.skills?.titles,
    groups: config.skills?.groups,
    versions: config.skills?.versions,
  });
  if (problems.length > 0) throw fail(`The Skills have problems:\n${problems.map((line) => `  ${line}`).join("\n")}`);
  const skillsByName = new Map(skills.map((skill) => [skill.name, skill]));
  const skillsByPackage = new Map();
  for (const skill of skills) skillsByPackage.set(skill.package, [...(skillsByPackage.get(skill.package) ?? []), skill]);

  // Skills that exist only inside Plugins (their files link to shared files the Plugin carries).
  const pluginOnly = new Set(config.skills?.pluginOnly ?? []);
  const output = new Map();
  const skillEntries = [];
  for (const skill of skills) {
    if (pluginOnly.has(skill.name) || pluginOnly.has(skill.package)) continue;
    const { bytes, ref } = archiveRef(skill.files, `skill-${skill.name}-${inFileName(skill.version)}.zip`);
    output.set(ref.url, bytes);
    skillEntries.push({
      name: skill.name,
      title: skill.title,
      version: skill.version,
      description: skill.description,
      group: skill.group,
      ...(skill.license ? { license: skill.license } : {}),
      files: skill.files.length,
      archive: ref,
    });
  }

  const pluginEntries = [];
  const seen = new Set();
  for (const definition of config.plugins ?? []) {
    checkPlugin(definition);
    if (seen.has(definition.name)) throw fail(`plugin "${definition.name}" is defined twice`);
    seen.add(definition.name);
    let files;
    let manifest;
    if (definition.directory) {
      const directory = resolve(configDirectory, definition.directory);
      if (!existsSync(directory) || !statSync(directory).isDirectory()) throw fail(`plugin "${definition.name}": ${directory} is not a directory`);
      files = listTree(directory);
      manifest = JSON.parse(files.find((file) => file.path === ".alran-plugin/plugin.json").content.toString("utf8"));
      if (manifest.name !== definition.name || manifest.version !== definition.version) {
        throw fail(`plugin "${definition.name}": its manifest names ${manifest.name}@${manifest.version}`);
      }
    } else {
      ({ files, manifest } = assembleBundle(definition, skillsByName, skillsByPackage, configDirectory, sourceRoot));
    }
    validateAssembled(definition, files);
    const { bytes, ref } = archiveRef(files, `plugin-${definition.name}-${inFileName(definition.version)}.zip`);
    output.set(ref.url, bytes);
    pluginEntries.push({
      name: definition.name,
      displayName: definition.displayName,
      version: definition.version,
      description: definition.description,
      author: definition.author,
      category: definition.category,
      ...(definition.license ? { license: definition.license } : {}),
      ...(definition.homepage ? { homepage: definition.homepage } : {}),
      exampleQueries: definition.exampleQueries ?? [],
      contents: describeContents(files, manifest),
      archive: ref,
    });
  }
  pluginEntries.sort((left, right) => (left.name < right.name ? -1 : 1));

  const index = {
    schema: "alran.store/v1",
    name: config.name,
    ...(config.description ? { description: config.description } : {}),
    plugins: pluginEntries,
    skills: skillEntries,
  };
  output.set("index.json", jsonBytes(index));
  return {
    files: output,
    summary: { plugins: pluginEntries.length, skills: skillEntries.length, archives: output.size - 1 },
  };
}

/** Writes `files` under `out`; removes archives of earlier builds that no longer belong. */
function writeOutput(out, files) {
  mkdirSync(join(out, "archives"), { recursive: true });
  for (const [path, bytes] of files) writeFileSync(join(out, ...path.split("/")), bytes);
  for (const name of readdirSync(join(out, "archives"))) {
    if (!files.has(`archives/${name}`)) rmSync(join(out, "archives", name));
  }
}

/** Differences between `files` and what is under `out`, as readable lines. */
function diffOutput(out, files) {
  const differences = [];
  for (const [path, bytes] of files) {
    const file = join(out, ...path.split("/"));
    if (!existsSync(file)) differences.push(`missing: ${path}`);
    else if (!readFileSync(file).equals(bytes)) differences.push(`changed: ${path}`);
  }
  const archives = join(out, "archives");
  if (existsSync(archives)) {
    for (const name of readdirSync(archives)) {
      if (!files.has(`archives/${name}`)) differences.push(`stale: archives/${name}`);
    }
  }
  return differences;
}

function parseArguments(argv) {
  const options = { check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--source", "--config", "--out"].includes(argument)) {
      const value = argv[(index += 1)];
      if (!value) throw fail(`${argument} needs a value`);
      options[argument.slice(2)] = value;
    } else throw fail(`Unknown argument: ${argument}`);
  }
  if (!options.source) throw fail("Usage: build-store.mjs --source <skills-repo> [--config <file>] [--out <dir>] [--check]");
  return options;
}

function main(argv) {
  try {
    const options = parseArguments(argv);
    const { files, summary } = buildStore(options);
    const out = resolve(options.out ?? join(options.source, "store"));
    if (options.check) {
      const differences = diffOutput(out, files);
      if (differences.length > 0) {
        console.error(`store out of date (${out}):\n${differences.map((line) => `  ${line}`).join("\n")}`);
        console.error("Run tools/store/build-store.mjs again and commit the result.");
        return 1;
      }
      console.log(`store up to date: ${summary.plugins} plugins, ${summary.skills} skills`);
      return 0;
    }
    writeOutput(out, files);
    console.log(`store written to ${out}: ${summary.plugins} plugins, ${summary.skills} skills, ${summary.archives} archives`);
    return 0;
  } catch (error) {
    if (error.expected) {
      console.error(`build-store: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
