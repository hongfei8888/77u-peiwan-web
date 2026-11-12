import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, option, launchChrome, sha256 } from './price-tools.mjs';

const sourcesFile = option('--sources', '_本地工作记录/icon-assets/2026-11-12-game-items/sources.json');
const sourceSet = JSON.parse(await readFile(resolve(root, sourcesFile), 'utf8'));
const expected = ['run','sweet-day','assault-day','other-games','season-3x3','gifts','prepaid'];
if (sourceSet.assets.length !== expected.length || expected.some(id => !sourceSet.assets.some(asset => asset.id === id))) {
  throw new Error('The approved icon set must contain all seven service IDs');
}
const browser = await launchChrome();
const context = await browser.newContext();
const page = await context.newPage();
const icons = {};
try {
  for (const asset of sourceSet.assets) {
    const bytes = await readFile(resolve(root, asset.source));
    const result = await page.evaluate(async ({ base64 }) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + base64;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const width = canvas.width, height = canvas.height;
      if ([0, width - 1, (height - 1) * width, width * height - 1].some(index => pixels[index * 4 + 3] > 8)) {
        throw new Error('Generated source must have transparent outer corners');
      }
      // Normalize transparent margins using the main connected icon tile.
      // Artwork colors and alpha are retained; the result is only a web-sized derivative.
      const seen = new Uint8Array(width * height);
      const queue = new Uint32Array(width * height);
      const seed = Math.floor(height / 2) * width + Math.floor(width / 2);
      if (pixels[seed * 4 + 3] < 32) throw new Error('Expected one centered opaque icon tile');
      let head = 0, tail = 1, minX = width, minY = height, maxX = 0, maxY = 0;
      queue[0] = seed; seen[seed] = 1;
      function add(index) {
        if (!seen[index] && pixels[index * 4 + 3] >= 32) { seen[index] = 1; queue[tail++] = index; }
      }
      while (head < tail) {
        const index = queue[head++], x = index % width, y = Math.floor(index / width);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        if (x > 0) add(index - 1); if (x < width - 1) add(index + 1);
        if (y > 0) add(index - width); if (y < height - 1) add(index + width);
      }
      if (tail < width * height * 0.3) throw new Error('Unexpectedly small generated icon');
      const box = { x: Math.max(0, minX - 2), y: Math.max(0, minY - 2), width: Math.min(width - minX + 2, maxX - minX + 5), height: Math.min(height - minY + 2, maxY - minY + 5) };
      const target = document.createElement('canvas'); target.width = 192; target.height = 192;
      const targetCtx = target.getContext('2d', { willReadFrequently: true });
      targetCtx.imageSmoothingEnabled = true; targetCtx.imageSmoothingQuality = 'high';
      const scale = 180 / Math.max(box.width, box.height);
      const drawWidth = box.width * scale, drawHeight = box.height * scale;
      targetCtx.drawImage(image, box.x, box.y, box.width, box.height, (192 - drawWidth) / 2, (192 - drawHeight) / 2, drawWidth, drawHeight);
      const dataUrl = target.toDataURL('image/webp', 0.9);
      if (!dataUrl.startsWith('data:image/webp;')) throw new Error('WebP encoding unavailable');
      const output = targetCtx.getImageData(0, 0, 192, 192).data;
      let transparentPixels = 0;
      for (let index = 3; index < output.length; index += 4) if (output[index] === 0) transparentPixels++;
      return { base64: dataUrl.split(',')[1], sourceWidth: width, sourceHeight: height, box, transparentPixels };
    }, { base64: bytes.toString('base64') });
    const optimized = Buffer.from(result.base64, 'base64');
    if (optimized.length > 50000) throw new Error(`Icon exceeds the 50KB budget: ${asset.id}`);
    const hash = sha256(optimized);
    const src = `images/service-icons/${asset.id}-${hash.slice(0, 12)}.webp`;
    await mkdir(resolve(root, 'images/service-icons'), { recursive: true });
    await writeFile(resolve(root, src), optimized);
    icons[asset.id] = { name: asset.name, src, width: 192, height: 192, bytes: optimized.length, sha256: hash,
      source: asset.source, sourceSha256: sha256(bytes), transparentPixels: result.transparentPixels };
  }
} finally {
  await context.close(); await browser.close();
}
const manifest = { version: 1, style: 'game-item-illustration', generator: 'built-in image_gen', approvedConcept: sourceSet.reference, icons };
const changes = new Map();
for (const filename of ['index.html', 'home.html', 'menu.html']) {
  let html = await readFile(resolve(root, filename), 'utf8');
  // The legacy homepage intentionally shows only four of these seven services.
  const presentIds = filename === 'home.html' ? ['run','sweet-day','assault-day','other-games'] : expected;
  for (const id of presentIds) {
    const pattern = new RegExp(`(<a\\b[^>]*\\bid="menu-link-${id}"[^>]*>)([\\s\\S]*?)(<\\/a>)`, 'g');
    let count = 0;
    html = html.replace(pattern, (match, start, content, end) => {
      const symbol = /<span class="poster-menu-symbol(?: [^"]*)?">[\s\S]*?<\/span>/;
      if (!symbol.test(content)) throw new Error(`Missing icon slot: ${filename}/${id}`);
      count++;
      const icon = icons[id];
      return start + content.replace(symbol, `<span class="poster-menu-symbol game-item-symbol"><img class="game-item-icon" src="${icon.src}" width="192" height="192" alt="" loading="lazy" decoding="async"></span>`) + end;
    });
    if (count !== 1) throw new Error(`Expected exactly one service card: ${filename}/${id}, found ${count}`);
  }
  changes.set(filename, html);
}
const cssVersion = sha256(await readFile(resolve(root, 'css/price-sync.css'))).slice(0, 12);
changes.set('price/detail.html', await readFile(resolve(root, 'price/detail.html'), 'utf8'));
for (const [filename, html] of changes) {
  await writeFile(resolve(root, filename), html.replace(/(css\/price-sync\.css\?v=)[^"]+/g, `$1${cssVersion}`));
}
await writeFile(resolve(root, 'content/service-icons.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ icons: expected.length, pages: 3, totalBytes: Object.values(icons).reduce((sum, icon) => sum + icon.bytes, 0), manifest: 'content/service-icons.json' }));
