#!/usr/bin/env node
// Checks a built store before it is published. The build itself already refuses to write an
// inconsistent store; this is the gate that says "this build may go out":
//
//   node scripts/check-store.mjs --store store [--baseline <index.json>] [--max-drop 5]
//
// What it checks:
//   - index.json is JSON, has the store schema, and lists Plugins and Skills;
//   - every archive the index names is there, has the size the index pins, and matches its SHA-256;
//   - every archive opens: the ZIP directory is read, every entry is read back and its CRC-32 is
//     the one the archive says;
//   - every Plugin archive carries its manifest (.alran-plugin/plugin.json) and the manifest names
//     the Plugin the index lists;
//   - the number of Plugins and Skills does not drop by more than --max-drop percent against a
//     baseline (the index of the previous build). With no baseline the check says so and passes.
//
// It prints one line per check and exits 1 on the first failure that matters.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { crc32 } from "../tools/store/lib/package-archive.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at >= 0 && args[at + 1] ? args[at + 1] : fallback;
};
const store = resolve(option("store", join(ROOT, "store")));
const baselineFile = option("baseline", undefined);
const maxDrop = Number(option("max-drop", "5"));

const problems = [];
const note = (line) => console.log(`  ${line}`);
const fail = (line) => {
  problems.push(line);
  console.log(`  FAIL ${line}`);
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Reads a ZIP archive: its entries, and the bytes of every entry. Throws when it is not a ZIP. */
function readArchive(bytes) {
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("no end-of-central-directory record");
  const count = bytes.readUInt16LE(end + 10);
  let at = bytes.readUInt32LE(end + 16);
  const entries = [];
  for (let index = 0; index < count; index += 1) {
    if (bytes.readUInt32LE(at) !== 0x02014b50) throw new Error("bad central directory header");
    const method = bytes.readUInt16LE(at + 10);
    const crc = bytes.readUInt32LE(at + 16);
    const compressed = bytes.readUInt32LE(at + 20);
    const uncompressed = bytes.readUInt32LE(at + 24);
    const nameLength = bytes.readUInt16LE(at + 28);
    const extraLength = bytes.readUInt16LE(at + 30);
    const commentLength = bytes.readUInt16LE(at + 32);
    const local = bytes.readUInt32LE(at + 42);
    const name = bytes.toString("utf8", at + 46, at + 46 + nameLength);
    if (method !== 0) throw new Error(`${name}: compression method ${method} is not supported`);
    if (bytes.readUInt32LE(local) !== 0x04034b50) throw new Error(`${name}: bad local header`);
    const localName = bytes.readUInt16LE(local + 26);
    const localExtra = bytes.readUInt16LE(local + 28);
    const start = local + 30 + localName + localExtra;
    const content = bytes.subarray(start, start + compressed);
    if (content.length !== compressed) throw new Error(`${name}: the entry is cut off`);
    if (uncompressed !== compressed) throw new Error(`${name}: the sizes do not match`);
    if (crc32(content) !== crc) throw new Error(`${name}: the CRC-32 does not match`);
    entries.push({ name, content });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

console.log(`check-store: ${store}`);

// 1. index.json
const indexFile = join(store, "index.json");
if (!existsSync(indexFile)) {
  fail(`${indexFile} does not exist`);
} else {
  const bytes = readFileSync(indexFile);
  let index;
  try {
    index = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(`index.json is not JSON: ${error.message}`);
  }
  if (index) {
    if (index.schema !== "alran.store/v1") fail(`index.json schema is ${JSON.stringify(index.schema)}`);
    if (!Array.isArray(index.plugins)) fail("index.json has no plugins array");
    if (!Array.isArray(index.skills)) fail("index.json has no skills array");
    const plugins = index.plugins ?? [];
    const skills = index.skills ?? [];
    note(`index.json is valid JSON: ${plugins.length} Plugins, ${skills.length} Skills, ${(bytes.length / 1024 / 1024).toFixed(1)} MiB`);

    // 2, 3 and 4: the archives.
    let opened = 0;
    let bytesRead = 0;
    for (const entry of [...plugins, ...skills]) {
      const url = entry?.archive?.url;
      if (typeof url !== "string") {
        fail(`${entry?.name ?? "?"}: no archive url`);
        continue;
      }
      const file = join(store, url);
      if (!existsSync(file)) {
        fail(`${entry.name}: ${url} does not exist`);
        continue;
      }
      const content = readFileSync(file);
      bytesRead += content.length;
      if (content.length !== entry.archive.size) {
        fail(`${entry.name}: ${url} is ${content.length} bytes, the index says ${entry.archive.size}`);
        continue;
      }
      if (sha256(content) !== entry.archive.archiveSha256) {
        fail(`${entry.name}: ${url} does not match the SHA-256 in the index`);
        continue;
      }
      let entries;
      try {
        entries = readArchive(content);
      } catch (error) {
        fail(`${entry.name}: ${url} does not open: ${error.message}`);
        continue;
      }
      if (entries.length === 0) {
        fail(`${entry.name}: ${url} is empty`);
        continue;
      }
      if (entry.contents) {
        // A Plugin: its archive has to carry the manifest, and the manifest has to name the Plugin.
        const manifest = entries.find((file2) => file2.name === ".alran-plugin/plugin.json");
        if (!manifest) {
          fail(`${entry.name}: ${url} has no .alran-plugin/plugin.json`);
          continue;
        }
        let parsed;
        try {
          parsed = JSON.parse(manifest.content.toString("utf8"));
        } catch (error) {
          fail(`${entry.name}: the manifest is not JSON: ${error.message}`);
          continue;
        }
        if (parsed.name !== entry.name) {
          fail(`${entry.name}: the manifest names ${JSON.stringify(parsed.name)}`);
          continue;
        }
        const skills = (parsed.skills ?? []).length;
        if (skills !== (entry.contents.skills ?? []).length) {
          fail(`${entry.name}: the manifest lists ${skills} Skills, the index lists ${(entry.contents.skills ?? []).length}`);
          continue;
        }
      }
      opened += 1;
    }
    note(`${opened} archives open, ${(bytesRead / 1024 / 1024).toFixed(1)} MiB read back and checked`);

    // 5: the counts against the previous build.
    if (baselineFile) {
      if (!existsSync(baselineFile)) {
        fail(`the baseline ${baselineFile} does not exist`);
      } else {
        const baseline = JSON.parse(readFileSync(baselineFile, "utf8"));
        const pairs = [
          ["Plugins", (baseline.plugins ?? []).length, plugins.length],
          ["Skills", (baseline.skills ?? []).length, skills.length],
        ];
        for (const [what, before, after] of pairs) {
          const drop = before === 0 ? (after === 0 ? 0 : 100) : ((before - after) / before) * 100;
          if (drop > maxDrop) fail(`${what} dropped by ${drop.toFixed(1)}% (${before} -> ${after}), more than ${maxDrop}%`);
          else note(`${what}: ${before} -> ${after} (${drop <= 0 ? "+" : ""}${((after - before) / Math.max(before, 1) * 100).toFixed(1)}%)`);
        }
      }
    } else {
      note("no baseline to compare against: the counts are not checked");
    }
  }
}

if (problems.length > 0) {
  console.error(`check-store: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log("check-store: the store is fit to publish");
