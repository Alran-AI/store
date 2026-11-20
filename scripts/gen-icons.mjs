#!/usr/bin/env node
// Writes the Plugin icons (128x128 RGBA PNG: a rounded square with a gradient and one glyph) to
// store/icons/. Icons are content, not build output: they are committed, and the store builder only
// copies them. Re-run to change a colour.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "store", "icons");
const SIZE = 128;

// One icon per Plugin of store/plugins.json: a glyph in rotation and a gradient whose hue comes from the name.
const GLYPH_NAMES = ["bars", "hexagon", "document"];
function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}
function hueOf(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}
const PACKAGES = existsSync(join(ROOT, "packages.json")) ? JSON.parse(readFileSync(join(ROOT, "packages.json"), "utf8")).packages : [];
// Plugins of store/plugins.json first (their icons do not change when a package is added), then packages.
const NAMES = [...JSON.parse(readFileSync(join(ROOT, "store", "plugins.json"), "utf8")).plugins.map((plugin) => plugin.name), ...PACKAGES.map((pkg) => pkg.name)];
const ICONS = Object.fromEntries(
  NAMES.map((name, index) => [name, [GLYPH_NAMES[index % GLYPH_NAMES.length], hslToRgb(hueOf(name), 0.55, 0.55), hslToRgb(hueOf(name), 0.6, 0.32)]]),
);

function crc32(buffer) {
  let crc = ~0;
  for (let n = 0; n < buffer.length; n += 1) {
    let c = (crc ^ buffer[n]) & 0xff;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(pixel) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y += 1) {
    raw[y * (SIZE * 4 + 1)] = 0;
    for (let x = 0; x < SIZE; x += 1) {
      const [r, g, b, a] = pixel(x, y);
      const offset = y * (SIZE * 4 + 1) + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const rect = (x, y, x0, x1, y0, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const GLYPHS = {
  bars: (x, y) => rect(x, y, -0.5, 0.5, -0.46, -0.3) || rect(x, y, -0.5, 0.2, -0.08, 0.08) || rect(x, y, -0.5, 0.36, 0.3, 0.46),
  hexagon: (x, y) => {
    const hex = (radius) => {
      const k = (radius * Math.sqrt(3)) / 2;
      return Math.abs(y) <= k && Math.abs((x * Math.sqrt(3)) / 2 + y / 2) <= k && Math.abs((x * Math.sqrt(3)) / 2 - y / 2) <= k;
    };
    return (hex(0.58) && !hex(0.4)) || Math.hypot(x, y) < 0.14;
  },
  document: (x, y) => {
    const page = rect(x, y, -0.36, 0.36, -0.52, 0.52);
    const inner = rect(x, y, -0.27, 0.27, -0.43, 0.43);
    const lines = rect(x, y, -0.16, 0.16, -0.24, -0.16) || rect(x, y, -0.16, 0.16, -0.04, 0.04) || rect(x, y, -0.16, 0.02, 0.16, 0.24);
    return (page && !inner) || lines;
  },
};
const insideRounded = (x, y) => {
  const radius = 0.42;
  const hx = Math.abs(x) - (1 - radius);
  const hy = Math.abs(y) - (1 - radius);
  return Math.abs(x) <= 1 && Math.abs(y) <= 1 && (hx <= 0 || hy <= 0 || Math.hypot(hx, hy) <= radius);
};

mkdirSync(OUT, { recursive: true });
for (const [name, [glyphName, from, to]] of Object.entries(ICONS)) {
  const glyph = GLYPHS[glyphName];
  const data = png((px, py) => {
    let covered = 0;
    let lit = 0;
    for (let sy = 0; sy < 3; sy += 1) {
      for (let sx = 0; sx < 3; sx += 1) {
        const x = ((px + (sx + 0.5) / 3) / SIZE) * 2 - 1;
        const y = ((py + (sy + 0.5) / 3) / SIZE) * 2 - 1;
        if (insideRounded(x, y)) {
          covered += 1;
          if (glyph(x, y)) lit += 1;
        }
      }
    }
    if (!covered) return [0, 0, 0, 0];
    const t = (px + py) / (2 * SIZE);
    const base = from.map((value, index) => value + (to[index] - value) * t);
    const mix = lit / covered;
    const color = base.map((value) => Math.round(value + (255 - value) * mix));
    return [color[0], color[1], color[2], Math.round((255 * covered) / 9)];
  });
  writeFileSync(join(OUT, `${name}.png`), data);
  // A package carries its icon inside itself. An icon that is already there is kept: the package is
  // pinned file by file, and the store that is published has to be the one the repository holds.
  const pkg = PACKAGES.find((entry) => entry.name === name);
  if (pkg) {
    const icon = join(ROOT, "packages", pkg.id, "icon.png");
    if (!existsSync(icon)) {
      mkdirSync(join(ROOT, "packages", pkg.id), { recursive: true });
      writeFileSync(icon, data);
    }
  }
}
// An icon of a Plugin that is gone is left behind otherwise, and the store publishes every file
// under store/icons/: the folder holds exactly one icon per Plugin.
for (const file of readdirSync(OUT)) {
  if (!file.endsWith(".png")) continue;
  if (!ICONS[file.slice(0, -4)]) rmSync(join(OUT, file));
}

console.log(`wrote ${Object.keys(ICONS).length} icons to ${OUT}`);
