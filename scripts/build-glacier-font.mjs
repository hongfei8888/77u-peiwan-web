// Rebuilds the Glacier Display heading font from Noto Sans SC Black.
//   npm run build:font -- --source <NotoSansSC-Black.otf> [--fonttools <path>]
// Needs fonttools with brotli (`pip install fonttools brotli`). The source font is
// not kept in the repository; see scripts/README.md.
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  root, sha256, option, fontCss, manifestPath,
  siteCharacters, everydayHanzi, formatUnicodeRange
} from './glacier-font-tools.mjs';

const source = option('--source', process.env.GLACIER_FONT_SOURCE);
if (!source) throw new Error('Pass --source <NotoSansSC-Black.otf> (or set GLACIER_FONT_SOURCE)');
const fonttools = option('--fonttools', 'fonttools');
const run = args => execFileSync(fonttools, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const sourceBytes = await readFile(resolve(source));
const cmapOf = file => new Set(
  [...run(['ttx', '-q', '-t', 'cmap', '-o', '-', file]).matchAll(/<map code="0x([0-9a-f]+)"/g)].map(m => parseInt(m[1], 16))
);
const nameOf = id => new RegExp(`nameID="${id}" platformID="3"[^>]*>\\s*([^<]*?)\\s*<`)
  .exec(run(['ttx', '-q', '-t', 'name', '-o', '-', resolve(source)]))?.[1] || '';
const family = nameOf(1), version = nameOf(5);
if (!/Noto Sans SC Black/.test(family)) throw new Error(`Expected Noto Sans SC Black, got "${family}"`);
const supported = cmapOf(resolve(source));

const site = await siteCharacters();
const unsupported = [...site.keys()].filter(code => !supported.has(code)).sort((a, b) => a - b);
const core = [...site.keys()].filter(code => supported.has(code));
const coreSet = new Set(core);
const everyday = [...everydayHanzi()].filter(code => supported.has(code) && !coreSet.has(code));

// The site copy ships in one file every page loads. Everyday hanzi outside it are
// split into slices the browser fetches only when a heading actually needs one.
const sliceCount = 3;
const slices = [{ file: 'fonts/glacier-display-900.woff2', label: 'site copy', codes: core }];
for (let i = 0; i < sliceCount; i++) {
  const from = Math.floor(everyday.length * i / sliceCount), to = Math.floor(everyday.length * (i + 1) / sliceCount);
  slices.push({ file: `fonts/glacier-display-900-ext${i + 1}.woff2`, label: `everyday hanzi ${i + 1}/${sliceCount}`, codes: everyday.slice(from, to) });
}

const work = await mkdtemp(join(tmpdir(), 'glacier-font-'));
try {
  for (const slice of slices) {
    const list = join(work, 'unicodes.txt'), out = join(work, 'slice.woff2');
    await writeFile(list, slice.codes.map(code => code.toString(16)).join('\n'));
    run(['subset', resolve(source), `--unicodes-file=${list}`, `--output-file=${out}`, '--flavor=woff2',
      '--layout-features=kern,palt,locl', '--desubroutinize', '--no-hinting', '--notdef-outline', '--name-IDs=0,1,2,3,4,5,6,13,14']);
    const built = cmapOf(out);
    const lost = slice.codes.filter(code => !built.has(code));
    if (lost.length) throw new Error(`${slice.file} lost ${lost.length} characters during subsetting`);
    slice.bytes = await readFile(out);
    slice.hash = sha256(slice.bytes);
    await writeFile(resolve(root, slice.file), slice.bytes);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

const face = slice => `@font-face {
  font-family: 'Glacier Display';
  src: url('./${slice.file.replace('fonts/', '')}?v=${slice.hash.slice(0, 12)}') format('woff2');
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  unicode-range: ${formatUnicodeRange(slice.codes)};
}`;
const css = `/* Noto Sans SC 900, local subsets. License: ./glacier-display-OFL.txt. Rebuild: npm run build:font (scripts/README.md) */
${slices.map(slice => `/* ${slice.label}: ${slice.codes.length} characters */\n${face(slice)}`).join('\n')}
`;
await writeFile(resolve(root, fontCss), css);
const cssVersion = sha256(Buffer.from(css)).slice(0, 12);

const pages = [
  ...(await readdir(root)).filter(file => file.endsWith('.html')),
  ...(await readdir(resolve(root, 'price'))).filter(file => file.endsWith('.html')).map(file => `price/${file}`)
];
const link = /((?:\.\.\/)?fonts\/glacier-display\.css)(?:\?v=[0-9a-f]+)?/g;
let updated = 0;
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  const next = html.replace(link, `$1?v=${cssVersion}`);
  if (next !== html) { await writeFile(resolve(root, page), next); updated++; }
}

const hex = code => `U+${code.toString(16).toUpperCase()}`;
await writeFile(resolve(root, manifestPath), JSON.stringify({
  version: 1,
  family: 'Glacier Display',
  source: { family, version, sha256: sha256(sourceBytes), license: 'fonts/glacier-display-OFL.txt' },
  stylesheet: { path: fontCss, version: cssVersion },
  slices: slices.map(slice => ({ file: slice.file, label: slice.label, characters: slice.codes.length, bytes: slice.bytes.length, sha256: slice.hash })),
  // In the site copy but absent from the source font; these fall back to the system face.
  unsupported: unsupported.map(code => ({ code: hex(code), char: String.fromCodePoint(code), firstSeen: site.get(code) }))
}, null, 2) + '\n');

for (const slice of slices) console.log(`${slice.file}  ${slice.codes.length} chars  ${(slice.bytes.length / 1024).toFixed(1)} KB`);
console.log(`${fontCss}?v=${cssVersion}  linked from ${updated} pages`);
if (unsupported.length) console.log(`Not in the source font (system fallback): ${unsupported.map(code => String.fromCodePoint(code)).join(' ')}`);
