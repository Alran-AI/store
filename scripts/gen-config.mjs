#!/usr/bin/env node
// Writes store/store.config.json from sources.json (which sources), versions.json (what vendor.mjs
// found) and store/plugins.json (what each Plugin is called and how it is described). Nothing in
// store.config.json is typed by hand: the counts and versions come from the vendored tree.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(join(ROOT, file), "utf8"));
const sources = read("sources.json").sources;
const { versions, counts } = read("versions.json");
const { plugins: meta } = read("store/plugins.json");
const WORDS = ["zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
const word = (n) => (n < WORDS.length ? WORDS[n] : n >= 21 && n <= 99 ? `${["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"][Math.floor(n / 10)]}${n % 10 ? `-${WORDS[n % 10].toLowerCase()}` : ""}` : String(n));

const problems = [];
const bySource = new Map(meta.map((entry) => [entry.source, entry]));
for (const source of sources) if (!bySource.has(source.id)) problems.push(`store/plugins.json has no entry for source "${source.id}"`);
for (const entry of meta) if (!sources.some((source) => source.id === entry.source)) problems.push(`store/plugins.json names an unknown source "${entry.source}"`);
if (problems.length > 0) {
  console.error(`gen-config:\n${problems.map((line) => `  ${line}`).join("\n")}`);
  process.exit(1);
}

const packages = existsSync(join(ROOT, "packages.json")) ? read("packages.json").packages : [];
const packagePlugins = packages.map((pkg) => {
  const manifestFile = join("packages", pkg.id, ".alran-plugin", "plugin.json");
  if (!existsSync(join(ROOT, manifestFile))) {
    console.error(`gen-config: ${manifestFile} does not exist; run scripts/vendor-package.mjs first`);
    process.exit(1);
  }
  return {
    name: pkg.name,
    displayName: pkg.displayName,
    version: read(manifestFile).version,
    description: pkg.description,
    author: pkg.author,
    license: pkg.license,
    homepage: pkg.repo,
    category: pkg.category,
    directory: `../packages/${pkg.id}`,
    exampleQueries: pkg.exampleQueries,
  };
});

const config = {
  schema: "alran.store.build/v1",
  name: "Alran Curated Store",
  description: "Skills and Plugins from open-source projects and platform vendors, redistributed unmodified under their own licences.",
  skills: {
    pluginOnly: meta.filter((entry) => entry.pluginOnly).map((entry) => entry.source),
    groups: Object.fromEntries(sources.map((source) => [source.id, source.label])),
    versions,
  },
  plugins: [...sources.map((source) => {
    const entry = bySource.get(source.id);
    const n = counts[source.id];
    return {
      name: entry.name,
      displayName: entry.displayName,
      version: versions[source.id],
      description: entry.description.replace("{N}", n === 1 ? "One" : word(n)),
      author: entry.author,
      license: source.spdx,
      homepage: source.repo,
      category: entry.category,
      icon: `icons/${entry.name}.png`,
      packages: [source.id],
      ...(entry.directories ? { directories: entry.directories } : {}),
      exampleQueries: entry.exampleQueries,
    };
  }), ...packagePlugins],
};
writeFileSync(join(ROOT, "store", "store.config.json"), `${JSON.stringify(config, null, 2)}\n`);
console.log(`store/store.config.json: ${config.plugins.length} Plugins (${packagePlugins.length} as packages), ${Object.values(counts).reduce((a, b) => a + b, 0)} Library Skills`);
