// Deterministic package archive and content digest of the Alran Plugin package format V1
// (docs/plugins/package-format-v1.md sections 5 and 6). Used by the store builder; the client
// reads the result with its own strict reader (packages/tui/src/store/archive.ts).
//
// The same bytes always come out of the same file tree: files in ascending path-byte order, STORE
// only, a fixed DOS timestamp, Unix 0644 regular-file attributes, no extra fields or comments.

import { createHash } from "node:crypto";

const DIGEST_MAGIC = Buffer.from("ALRAN-PLUGIN-CONTENT-DIGEST\0", "ascii");
const DOS_DATE_1980_01_01 = 0x0021;
const VERSION_MADE_BY_UNIX_2_0 = (3 << 8) | 20;
const VERSION_NEEDED = 10;
const REGULAR_FILE_ATTRIBUTES = (0o100644 << 16) >>> 0;

const CRC_TABLE = Array.from({ length: 256 }, (_value, index) => {
  let current = index;
  for (let bit = 0; bit < 8; bit += 1) {
    current = (current & 1) === 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
  }
  return current >>> 0;
});

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function byPathBytes(left, right) {
  return Buffer.compare(Buffer.from(left.path, "ascii"), Buffer.from(right.path, "ascii"));
}

function uint32be(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value);
  return buffer;
}

function uint64be(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(value));
  return buffer;
}

/** `files` is `[{ path, content: Buffer }]`; returns `sha256-tree-v1:<hex>`. */
export function contentDigest(files) {
  const sorted = [...files].sort(byPathBytes);
  const hash = createHash("sha256");
  hash.update(DIGEST_MAGIC);
  hash.update(uint32be(1));
  hash.update(uint32be(sorted.length));
  for (const file of sorted) {
    const pathBytes = Buffer.from(file.path, "ascii");
    hash.update(Buffer.from([0x46]));
    hash.update(uint32be(pathBytes.length));
    hash.update(pathBytes);
    hash.update(uint64be(file.content.length));
    hash.update(file.content);
  }
  return `sha256-tree-v1:${hash.digest("hex")}`;
}

/** Builds the deterministic ZIP of a file tree. Throws on names a V1 archive cannot hold. */
export function buildArchive(files) {
  const sorted = [...files].sort(byPathBytes);
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of sorted) {
    const name = Buffer.from(file.path, "ascii");
    if (name.toString("ascii") !== file.path) throw new Error(`Not an ASCII path: ${file.path}`);
    const crc = crc32(file.content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(DOS_DATE_1980_01_01, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.content.length, 18);
    local.writeUInt32LE(file.content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, file.content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(VERSION_MADE_BY_UNIX_2_0, 4);
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(DOS_DATE_1980_01_01, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.content.length, 20);
    central.writeUInt32LE(file.content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(REGULAR_FILE_ATTRIBUTES, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + file.content.length;
  }
  const centralBytes = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBytes, end]);
}

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
