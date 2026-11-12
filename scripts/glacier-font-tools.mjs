// Shared by build-glacier-font.mjs and test-glacier-font.mjs. No npm dependencies,
// so the coverage check runs without `npm ci`.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const fontCss = 'fonts/glacier-display.css';
export const manifestPath = 'content/glacier-font.json';

export function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

// Characters the display face is expected to draw. Emoji, box drawing and other
// symbols stay with the system font on purpose.
const wanted = code =>
  (code >= 0x20 && code <= 0x7e) ||
  (code >= 0xa1 && code <= 0xbf) || code === 0xd7 || code === 0xf7 ||
  (code >= 0x2010 && code <= 0x205e) ||
  (code >= 0x2190 && code <= 0x21ff) ||
  (code >= 0x3001 && code <= 0x303f) ||
  (code >= 0x4e00 && code <= 0x9fff) ||
  (code >= 0xff01 && code <= 0xff5e);

async function sourceFiles() {
  const list = async (dir, test) => (await readdir(resolve(root, dir), { withFileTypes: true }))
    .filter(entry => entry.isFile() && test(entry.name)).map(entry => `${dir === '.' ? '' : dir + '/'}${entry.name}`);
  return [
    ...await list('.', name => name.endsWith('.html')),
    ...await list('price', name => name.endsWith('.html')),
    ...await list('js', name => name.endsWith('.js')),
    ...await list('content', name => name.endsWith('.json') && `content/${name}` !== manifestPath)
  ].sort();
}

// Every character that appears in a page, a script or a content file, mapped to
// the first file that uses it. Headings are built from all three, and titles
// move between them, so the whole site copy is the unit rather than <h1>/<h2>.
export async function siteCharacters() {
  const found = new Map();
  for (let code = 0x20; code <= 0x7e; code++) found.set(code, '(ASCII)');
  for (const file of await sourceFiles()) {
    for (const char of await readFile(resolve(root, file), 'utf8')) {
      const code = char.codePointAt(0);
      if (wanted(code) && !found.has(code)) found.set(code, file);
    }
  }
  return found;
}

// GB 2312 level-1 hanzi (3,755 everyday characters). Covers names, posts and
// announcements typed later, which the site copy cannot predict.
export function everydayHanzi() {
  const decoder = new TextDecoder('gbk');
  const codes = new Set();
  for (let lead = 0xb0; lead <= 0xd7; lead++) {
    for (let trail = 0xa1; trail <= 0xfe; trail++) {
      const code = decoder.decode(Uint8Array.of(lead, trail)).codePointAt(0);
      if (code >= 0x4e00 && code <= 0x9fff) codes.add(code);
    }
  }
  return codes;
}

export function formatUnicodeRange(codes) {
  const sorted = [...codes].sort((a, b) => a - b), parts = [];
  const hex = code => code.toString(16).toUpperCase();
  for (let i = 0; i < sorted.length; i++) {
    let end = i;
    while (end + 1 < sorted.length && sorted[end + 1] === sorted[end] + 1) end++;
    parts.push(end > i ? `U+${hex(sorted[i])}-${hex(sorted[end])}` : `U+${hex(sorted[i])}`);
    i = end;
  }
  return parts.join(',');
}

export function parseUnicodeRange(value) {
  const codes = new Set();
  for (const part of value.split(',')) {
    const match = /^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i.exec(part.trim());
    if (!match) throw new Error(`Unreadable unicode-range entry: ${part}`);
    const start = parseInt(match[1], 16), end = match[2] ? parseInt(match[2], 16) : start;
    for (let code = start; code <= end; code++) codes.add(code);
  }
  return codes;
}

// [{ file, version, codes }] for each @font-face in the stylesheet.
export function parseFontFaces(css) {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const src = /url\(['"]?\.\/([^'")?]+)(?:\?v=([0-9a-f]+))?['"]?\)/.exec(body);
    const range = /unicode-range:\s*([^;]+);/.exec(body);
    if (!src || !range) throw new Error('Every @font-face needs a local src and a unicode-range');
    return { file: `fonts/${src[1]}`, version: src[2] || null, codes: parseUnicodeRange(range[1]) };
  });
}
