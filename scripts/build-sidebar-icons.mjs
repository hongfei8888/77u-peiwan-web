import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha256 } from './price-tools.mjs';

const entries = [
  ['home','首页','index.html'], ['events','活动','activities.html'], ['menu','玩法菜单','menu.html'],
  ['players','陪玩社区','players.html'], ['community','交流社区','community.html'],
  ['join','加入我们','join.html'], ['reviews','好评','reviews.html'], ['contact','联系我们','contact.html']
];
const byPage = new Map(entries.map(([id, name, page]) => [page, { id, name }]));
const icons = {};
const markup = {};
for (const [id, name, page] of entries) {
  const src = `images/sidebar-icons/${id}.svg`;
  const bytes = await readFile(resolve(root, src));
  markup[id] = bytes.toString('utf8').trim().replace(/\r?\n/g, '');
  if (!markup[id].includes(`data-sidebar-icon="${id}"`)) throw new Error(`Wrong source icon: ${id}`);
  icons[id] = { name, page, src, sha256: sha256(bytes), bytes: bytes.length };
}
const isNav = tag => /class="([^"]+)"/.exec(tag)?.[1].split(/\s+/).includes('nav-link');
const pageName = tag => /href="([^"]+)"/.exec(tag)?.[1].replace(/^\.\.\//, '').split(/[?#]/)[0];
const cssLink = /<link\b[^>]*href="(?:\.\.\/)?css\/sidebar-icons\.css[^\"]*"[^>]*>/g;
const anchors = /(<a\b[^>]*>)([\s\S]*?)(<\/a>)/g;
function protectedHtml(html) {
  return html.replace(cssLink, '').replace(anchors, (match, tag, content, end) =>
    isNav(tag) && byPage.has(pageName(tag)) ? tag + content.replace(/<svg\b[\s\S]*?<\/svg>/, '<NAV-ICON/>') + end : match);
}
const output = resolve(root, '_本地工作记录/sidebar-icons/2026-11-12-mature-a');
await mkdir(output, { recursive: true });
const baseline = { pages: {}, files: {} };
for (const filename of ['js/poster-menu.generated.js','content/owner-rights.json','content/service-icons.json','js/main.js','js/theme-toggle.js']) {
  baseline.files[filename] = sha256(await readFile(resolve(root, filename)));
}
const files = [
  ...(await readdir(root)).filter(file => file.endsWith('.html')),
  ...(await readdir(resolve(root, 'price'))).filter(file => file.endsWith('.html')).map(file => `price/${file}`)
];
const cssVersion = sha256(await readFile(resolve(root, 'css/sidebar-icons.css'))).slice(0, 12);
const pending = new Map();
let instanceCount = 0;
for (const filename of files) {
  const original = await readFile(resolve(root, filename), 'utf8');
  const links = [];
  let count = 0;
  let html = original.replace(anchors, (match, tag, content, end) => {
    if (!isNav(tag)) return match;
    const icon = byPage.get(pageName(tag));
    links.push({ href: /href="([^"]+)"/.exec(tag)?.[1], tag, label: content.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, '').trim(), icon: icon?.id || null });
    if (!icon) return match;
    if (!/<svg\b[\s\S]*?<\/svg>/.test(content)) throw new Error(`Missing SVG to replace: ${filename}/${icon.id}`);
    count++;
    return tag + content.replace(/<svg\b[\s\S]*?<\/svg>/, markup[icon.id]) + end;
  });
  if (!count) continue;
  const prefix = filename.startsWith('price/') ? '../' : '';
  html = html.replace(cssLink, '').replace('</head>', `<link rel="stylesheet" href="${prefix}css/sidebar-icons.css?v=${cssVersion}"></head>`);
  if (protectedHtml(html) !== protectedHtml(original)) throw new Error(`Unexpected non-icon modification: ${filename}`);
  baseline.pages[filename] = { protectedHtmlSha256: sha256(Buffer.from(protectedHtml(original))), links, iconCount: count };
  pending.set(filename, html);
  instanceCount += count;
}
await writeFile(resolve(output, 'before.json'), JSON.stringify(baseline, null, 2) + '\n', { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
for (const [filename, html] of pending) await writeFile(resolve(root, filename), html);
await writeFile(resolve(root, 'content/sidebar-icons.json'), JSON.stringify({ version: 1, style: 'mature-precise-duotone', format: 'inline SVG',
  approvedConcept: '_本地工作记录/sidebar-icon-concepts/2026-11-12/mature-v2/sidebar-mature-a-precise-duotone-v2.png',
  css: `css/sidebar-icons.css?v=${cssVersion}`, size: 22, pages: [...pending.keys()], instanceCount, icons }, null, 2) + '\n');
console.log(JSON.stringify({ icons: entries.length, pages: pending.size, instances: instanceCount, svgBytes: Object.values(icons).reduce((sum, icon) => sum + icon.bytes, 0), cssVersion }));
