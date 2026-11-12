import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname, relative, sep } from 'node:path';
import { root, option, readMenu, sha256, imageSize } from './price-tools.mjs';

const reportPath = option('--report');
if (!reportPath) throw new Error('Usage: npm run sync:price -- --report <complete-probe-report.json>');
const reportFile = resolve(root, reportPath);
const evidenceRoot = dirname(reportFile);
const report = JSON.parse(await readFile(reportFile, 'utf8'));
if (!report.complete || report.errors.length || report.schemaVersion !== 1) throw new Error('Only a complete, error-free probe snapshot can be applied');
const data = readMenu();
const rights = JSON.parse(await readFile(resolve(root, 'content/owner-rights.json'), 'utf8'));
const benefits = report.entries.find(entry => entry.id === 'benefits')?.posters[0];
if (!benefits || benefits.sha256 !== rights.sourceSha256 || rights.rules.length !== 20) {
  throw new Error('Review the owner-rights transcription against the new source image before applying this snapshot');
}
for (const entry of data.entries) {
  const source = report.entries.find(current => current.id === entry.id);
  if (!source || source.posters.length < entry.posters.length) throw new Error(`Snapshot would remove existing content: ${entry.id}`);
}
if (new Set(report.entries.map(entry => entry.id)).size !== report.entries.length) throw new Error('Duplicate entry IDs');
await writeFile(resolve(evidenceRoot, 'local-menu.json'), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });

function contained(base, path) {
  const target = resolve(base, path);
  const rel = relative(base, target);
  if (rel === '..' || rel.startsWith(`..${sep}`) || resolve(base, rel) !== target || rel.includes(':')) throw new Error(`Path outside expected directory: ${path}`);
  return target;
}
const pendingCopies = new Map();
async function resource(asset, kind) {
  if (asset.status !== 200 || !asset.sha256 || !asset.width || !asset.height) throw new Error('Incomplete resource');
  if (asset.difference === 'same') {
    if (!asset.localSrc || sha256(await readFile(contained(root, asset.localSrc))) !== asset.sha256) throw new Error(`Local file changed after probe: ${asset.localSrc}`);
    return asset.localSrc;
  }
  if (!asset.stagedFile) throw new Error('Missing staged image');
  const staged = contained(evidenceRoot, asset.stagedFile);
  const bytes = await readFile(staged);
  const size = imageSize(bytes);
  if (sha256(bytes) !== asset.sha256 || size.width !== asset.width || size.height !== asset.height) throw new Error(`Staged file failed verification: ${staged}`);
  const destination = `images/poster-menu/${kind}-${asset.sha256.slice(0, 12)}${extname(asset.stagedFile)}`;
  pendingCopies.set(destination, staged);
  return destination;
}

const iconMap = new Map();
for (const icon of report.icons) {
  const src = await resource(icon, 'icon');
  iconMap.set(`${icon.kind}:${icon.id}`, { src, width: icon.width, height: icon.height });
}
let nextPoster = Math.max(...data.posters.map(poster => Number(poster.id.replace('poster-', '')))) + 1;
for (const sourceEntry of report.entries) {
  let entry = data.entries.find(existing => existing.id === sourceEntry.id);
  if (!entry) {
    entry = { id: sourceEntry.id, name: sourceEntry.name, parent: sourceEntry.parent, icon: null, kind: sourceEntry.kind, posters: [] };
    data.entries.push(entry);
  }
  entry.name = sourceEntry.name;
  entry.parent = sourceEntry.parent;
  entry.kind = sourceEntry.kind;
  entry.source = { page: sourceEntry.page };
  const icon = iconMap.get(`entry:${entry.id}`);
  if (icon) entry.icon = { ...icon, alt: `${entry.name}头像` };
  const posters = [];
  for (const image of sourceEntry.posters) {
    const src = await resource(image, 'poster');
    const existingId = entry.posters[image.index]?.id;
    const id = existingId || `poster-${nextPoster++}`;
    let poster = data.posters.find(existing => existing.id === id);
    if (!poster) { poster = { id }; data.posters.push(poster); }
    if (poster.src && poster.src !== src) delete poster.displaySrc;
    Object.assign(poster, { src, width: image.width, height: image.height,
      source: { page: sourceEntry.page, url: image.url, sha256: image.sha256 } });
    posters.push({ id, label: image.label });
  }
  entry.posters = posters;
}
data.categories = report.categories.map(category => ({ id: category.id, name: category.name, entries: category.entries }));
data.home = report.home.map(item => item.kind === 'category' ? {
  ...item, icon: { ...iconMap.get(`category:${item.id}`), alt: `${item.name}头像` }
} : item);
data.utilities = report.utilities;
data.updatedAt = report.finishedAt.slice(0, 10);
data.source = { page: report.source, checkedAt: report.finishedAt };

const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<span class="poster-menu-arrow"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"/></svg></span>';
function newCard(id, kind, name, summary) {
  const icon = iconMap.get(`${kind === 'category' ? 'category' : 'entry'}:${id}`);
  return `<a class="poster-menu-card poster-menu-card--compact poster-menu-card--ice" id="menu-link-${id}" data-menu-link href="price/detail.html?${kind}=${id}"><span class="poster-menu-symbol"><img class="price-service-icon" src="${icon.src}" width="${icon.width}" height="${icon.height}" alt="" loading="lazy" decoding="async"></span><span class="poster-menu-copy"><span class="poster-menu-name">${name}</span><span class="poster-menu-summary">${summary}</span></span>${arrow}</a>`;
}
const cards = newCard('laotai', 'category', '老太专属单', '护航、陪做与专属玩法') + '\n' + newCard('double-fun', 'item', '双妹趣味单', '查看娱乐玩法与价格') + '\n';
const menuText = `/* Verified official price snapshot. See scripts/README.md. */\nwindow.POSTER_MENU = ${JSON.stringify(data, null, 2)};\n`;
const rendererText = await readFile(resolve(root, 'js/poster-menu.js'), 'utf8');
const cssText = await readFile(resolve(root, 'css/price-sync.css'), 'utf8');
const posterCssText = await readFile(resolve(root, 'css/poster-menu.css'), 'utf8');
const versions = { data: sha256(Buffer.from(menuText)).slice(0, 12), renderer: sha256(Buffer.from(rendererText)).slice(0, 12), css: sha256(Buffer.from(cssText)).slice(0, 12), posterCss: sha256(Buffer.from(posterCssText)).slice(0, 12) };
const pendingHtml = new Map();
for (const filename of ['index.html', 'home.html', 'menu.html', 'price/detail.html']) {
  let html = await readFile(resolve(root, filename), 'utf8');
  const prefix = filename.startsWith('price/') ? '../' : '';
  html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/)?css\/price-sync\.css[^\"]*">\s*/g, '');
  html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}css/price-sync.css?v=${versions.css}"></head>`);
  html = html.replace(/(css\/poster-menu\.css\?v=)[^\"]+/g, `$1${versions.posterCss}`)
    .replace(/(js\/poster-menu\.generated\.js\?v=)[^\"]+/g, `$1${versions.data}`)
    .replace(/(js\/poster-menu\.js\?v=)[^\"]+/g, `$1${versions.renderer}`);
  if (filename !== 'price/detail.html') {
    html = html.replace(/class="poster-menu-grid"/g, 'class="poster-menu-grid price-menu-grid"');
    for (const id of ['laotai', 'double-fun']) {
      html = html.replace(new RegExp(`<a\\b[^>]*\\bid="menu-link-${id}"[^>]*>[\\s\\S]*?<\\/a>\\s*`, 'g'), '');
    }
    const anchor = /<a\b[^>]*\bid="menu-link-sweet-day"[^>]*>/;
    if (!anchor.test(html)) throw new Error(`Missing insertion anchor in ${filename}`);
    html = html.replace(anchor, match => cards + match);
  }
  if (html.includes('class="menu-rights-list"')) {
    const rules = rights.rules.map((rule, index) => `<li><span class="menu-rule-number">${String(index + 1).padStart(2, '0')}</span><div><h3>${escape(rule.title)}</h3><p>${escape(rule.text)}</p></div></li>`).join('');
    html = html.replace(/<ol class="menu-rights-list">[\s\S]*?<\/ol>/, `<ol class="menu-rights-list">${rules}</ol>`);
    if (!html.includes('id="menu-rights-original"')) html = html.replace(/(<p class="menu-rights-intro">[\s\S]*?)(<\/p>)/,
      '$1 <a id="menu-rights-original" href="price/detail.html?item=benefits" data-menu-link>查看完整原图</a>$2');
  }
  if (filename === 'price/detail.html') {
    const entries = [...data.entries].sort((a, b) => {
      const order = ['home', 'pc', 'mobile', 'laotai'];
      return order.indexOf(a.parent) - order.indexOf(b.parent);
    });
    const links = entries.map(entry => {
      const parent = data.categories.find(category => category.id === entry.parent);
      const name = (parent ? `${parent.name} · ` : '') + entry.name;
      return `<li>${escape(name)}：${entry.posters.map(reference => {
        const poster = data.posters.find(p => p.id === reference.id);
        return `<a href="../${poster.displaySrc || poster.src}">${escape(reference.label)}</a>`;
      }).join(' / ')}</li>`;
    }).join('\n');
    const fallback = /(<noscript><div class="poster-noscript">[\s\S]*?<ul>)[\s\S]*?(<\/ul>)/;
    if (!fallback.test(html)) throw new Error('Missing no-JavaScript fallback');
    html = html.replace(fallback, `$1${links}$2`);
  }
  pendingHtml.set(filename, html);
}

// Resolve and verify every input before changing the site. The source probe
// never invokes this script, and incomplete snapshots cannot reach this point.
for (const [destination, staged] of pendingCopies) {
  const target = contained(root, destination);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(staged, target);
}
await writeFile(resolve(root, 'js/poster-menu.generated.js'), menuText);
for (const [filename, html] of pendingHtml) await writeFile(resolve(root, filename), html);
console.log(JSON.stringify({ entries: data.entries.length, categories: data.categories.length, posters: data.posters.length, copiedResources: pendingCopies.size, versions }));
