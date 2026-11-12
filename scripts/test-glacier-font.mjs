// Fails when the site copy uses a character the Glacier Display subsets do not
// contain: that character would be drawn by the system font at a lighter weight,
// inside an otherwise heavy heading. Run after editing any page text.
//   npm run test:font
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha256, fontCss, manifestPath, siteCharacters, parseFontFaces } from './glacier-font-tools.mjs';

const problems = [];
const cssBytes = await readFile(resolve(root, fontCss));
const faces = parseFontFaces(cssBytes.toString('utf8'));
const manifest = JSON.parse(await readFile(resolve(root, manifestPath), 'utf8'));

const covered = new Set();
for (const face of faces) {
  for (const code of face.codes) {
    if (covered.has(code)) problems.push(`U+${code.toString(16).toUpperCase()} is declared by two @font-face rules`);
    covered.add(code);
  }
  const bytes = await readFile(resolve(root, face.file)).catch(() => null);
  if (!bytes) { problems.push(`${face.file} is missing`); continue; }
  const hash = sha256(bytes);
  if (face.version !== hash.slice(0, 12)) problems.push(`${face.file}: ?v=${face.version} does not match the file (${hash.slice(0, 12)})`);
  if (!manifest.slices.some(slice => slice.file === face.file && slice.sha256 === hash)) problems.push(`${face.file} differs from ${manifestPath}`);
}

const unsupported = new Set(manifest.unsupported.map(entry => parseInt(entry.code.slice(2), 16)));
const missing = new Map();
for (const [code, file] of await siteCharacters()) {
  if (covered.has(code) || unsupported.has(code)) continue;
  if (!missing.has(file)) missing.set(file, []);
  missing.get(file).push(String.fromCodePoint(code));
}
for (const [file, chars] of missing) problems.push(`${file} uses characters outside the font: ${chars.join('')}`);

const cssVersion = sha256(cssBytes).slice(0, 12);
const pages = [
  ...(await readdir(root)).filter(file => file.endsWith('.html')),
  ...(await readdir(resolve(root, 'price'))).filter(file => file.endsWith('.html')).map(file => `price/${file}`)
];
for (const page of pages) {
  const html = await readFile(resolve(root, page), 'utf8');
  for (const [, version] of html.matchAll(/fonts\/glacier-display\.css(?:\?v=([0-9a-f]+))?/g)) {
    if (version !== cssVersion) problems.push(`${page} links ${fontCss}?v=${version || '(none)'}, expected ${cssVersion}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s). Rebuild with: npm run build:font -- --source <NotoSansSC-Black.otf>`);
  process.exit(1);
}
console.log(`Glacier Display covers the site copy: ${covered.size} characters in ${faces.length} files, ${pages.length} pages checked.`);
