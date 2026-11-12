import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { root, option, launchChrome, readMenu, sha256, imageSize, waitForImage } from './price-tools.mjs';

const source = new URL(option('--source', 'https://www.77uclub.com/price/index.html'));
const sourceRoot = new URL('./', source);
const output = resolve(root, option('--output', `_本地工作记录/price-sync/${new Date().toISOString().replace(/[:.]/g, '-')}`));
const screenshots = !process.argv.includes('--no-screenshots');
const local = readMenu();
const report = {
  schemaVersion: 1, source: source.href, startedAt: new Date().toISOString(), complete: false,
  home: [], categories: [], entries: [], utilities: [], icons: [], pages: [], errors: [],
  excluded: ['官方二创动画', '幸运大转盘（保留本站已有入口）', '排行榜', '数字化定制服务']
};
const homeIds = new Map([
  ['跑刀/陪跑', 'run'], ['双妹趣味单(娱乐)', 'double-fun'], ['甜蜜包天(娱乐)', 'sweet-day'],
  ['包天猛攻(技术)', 'assault-day'], ['赛季3×3代肝', 'season-3x3'], ['其他游戏陪玩', 'other-games'],
  ['礼物打赏单', 'gifts'], ['充值预存', 'prepaid']
]);
const plainName = text => text.replace(/\s+/g, '').replace(/^限时/, '');
const absolute = path => new URL(path, sourceRoot).href;
const localEntry = id => local.entries.find(entry => entry.id === id);
const localPoster = (id, index) => local.posters.find(poster => poster.id === localEntry(id)?.posters[index]?.id);
let browser, context, page;

await mkdir(resolve(output, 'assets'), { recursive: true });
await mkdir(resolve(output, 'screenshots'), { recursive: true });
await writeFile(resolve(output, 'local-menu.json'), JSON.stringify(local, null, 2) + '\n');

function addIcon(kind, id, url, localSrc) {
  if (url) report.icons.push({ kind, id, url: absolute(url), localSrc });
}

async function visit(url, kind, id) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw new Error(`${url}: HTTP ${response?.status()}`);
  report.pages.push({ url: page.url(), kind, id, status: response.status() });
}

async function screenshot(name, fullPage = false) {
  if (screenshots) await page.screenshot({ path: resolve(output, 'screenshots', `${name}.png`), fullPage });
}

async function singlePoster(entry, path, label) {
  const url = new URL('detail.html', sourceRoot);
  url.searchParams.set('img', path);
  url.searchParams.set('label', label);
  await visit(url.href, 'single', entry.id);
  const image = await waitForImage(page, '#detail-container img');
  entry.page = page.url();
  entry.posters = [{ index: 0, label: entry.name, ...image, declaredUrl: absolute(path) }];
  if (entry.id === 'benefits') await screenshot('official-benefits', true);
}

async function galleryPosters(entry, galleryKey) {
  const url = new URL('detail.html', sourceRoot);
  url.searchParams.set('gallery', galleryKey);
  await visit(url.href, 'gallery', entry.id);
  entry.page = page.url();
  entry.galleryKey = galleryKey;
  entry.posters = [];
  const tabs = page.getByRole('tab');
  const count = await tabs.count();
  if (count < 2) throw new Error(`Missing gallery tabs: ${galleryKey}`);
  for (let index = 0; index < count; index++) {
    const tab = tabs.nth(index);
    const label = (await tab.innerText()).trim();
    await tab.click();
    if (await tab.getAttribute('aria-selected') !== 'true') throw new Error(`Tab did not select: ${galleryKey}/${index}`);
    const image = await waitForImage(page, '.activity-panel.active img');
    entry.posters.push({ index, label, ...image });
  }
  if (galleryKey === 'pc-fun') await screenshot('official-pc-fun-last-tab');
}

async function compareResource(asset, localSrc, filename) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await context.request.get(asset.url, { timeout: 20000 });
      if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
      break;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  asset.status = response.status();
  asset.contentType = response.headers()['content-type'];
  if (!asset.contentType?.startsWith('image/')) throw new Error(`Not an image: ${asset.url}`);
  const bytes = await response.body();
  const dimensions = imageSize(bytes);
  if (asset.width && (asset.width !== dimensions.width || asset.height !== dimensions.height)) {
    throw new Error(`Browser and downloaded image dimensions differ: ${asset.url}`);
  }
  Object.assign(asset, dimensions, { sha256: sha256(bytes), bytes: bytes.length });
  asset.localSrc = localSrc || null;
  if (localSrc) {
    try { asset.localSha256 = sha256(await readFile(resolve(root, localSrc))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  asset.difference = !asset.localSha256 ? 'new' : asset.localSha256 === asset.sha256 ? 'same' : 'changed';
  if (asset.difference !== 'same') {
    const extension = asset.contentType.includes('png') ? '.png' : asset.contentType.includes('webp') ? '.webp' : '.jpg';
    asset.stagedFile = `assets/${filename}-${asset.sha256.slice(0, 12)}${extension}`;
    await writeFile(resolve(output, asset.stagedFile), bytes);
  }
}

try {
  browser = await launchChrome();
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ type: 'pageerror', url: page.url(), message: error.message }));
  await visit(source.href, 'home', 'home');
  await page.locator('.cat-card').first().waitFor();
  const home = await page.evaluate(() => ({
    cards: [...document.querySelectorAll('.cat-card')].map(card => ({
      name: card.innerText.trim(), onclick: card.getAttribute('onclick'), href: card.getAttribute('href'),
      icon: card.querySelector('img')?.getAttribute('src')
    })),
    utilities: [...document.querySelectorAll('.bottom-card')].map(card => ({
      name: card.querySelector('.bottom-label')?.textContent.trim(), src: card.querySelector('img')?.getAttribute('src')
    }))
  }));
  await screenshot('official-home', true);
  const categoryQueue = [];
  const singleQueue = [];
  for (const card of home.cards) {
    const categoryCall = card.onclick?.match(/^openCategory\('([^']+)'\)/);
    const linkedCategory = card.href && new URL(card.href, source).searchParams.get('category');
    const categoryId = categoryCall?.[1] || linkedCategory;
    const name = plainName(card.name);
    if (categoryId === 'anime' || name === '官方二创动画' || name === '幸运大转盘') continue;
    if (categoryId) {
      report.home.push({ kind: 'category', id: categoryId, name });
      categoryQueue.push({ id: categoryId, name });
      addIcon('category', categoryId, card.icon, local.home.find(item => item.id === categoryId)?.icon?.src);
      continue;
    }
    const detailCall = card.onclick?.match(/^openDetail\('([^']+)',\s*'([^']+)'/);
    if (!detailCall || !homeIds.has(name)) throw new Error(`Unmapped price home entry: ${card.name}`);
    const id = homeIds.get(name);
    const entry = { id, name, parent: 'home', kind: 'single', posters: [] };
    report.home.push({ kind: 'item', id });
    report.entries.push(entry);
    addIcon('entry', id, card.icon, localEntry(id)?.icon?.src);
    singleQueue.push({ entry, path: detailCall[1], label: detailCall[2] });
  }
  for (const utility of home.utilities) {
    const id = { '柒大保障': 'guarantees', '老板权益': 'benefits' }[utility.name];
    if (!id || !utility.src) throw new Error(`Unmapped utility: ${utility.name}`);
    const entry = { id, name: utility.name, parent: 'home', kind: 'single', posters: [] };
    report.utilities.push(id);
    report.entries.push(entry);
    singleQueue.push({ entry, path: utility.src, label: utility.name });
  }
  const galleryQueue = [];
  for (const category of categoryQueue) {
    const url = new URL('detail.html', sourceRoot);
    url.searchParams.set('category', category.id);
    await visit(url.href, 'category', category.id);
    const items = await page.locator('#detail-container .service-card').evaluateAll(cards => cards.map(card => ({
      name: card.querySelector('.service-name')?.textContent.trim(), ...card.dataset,
      icon: card.querySelector('img')?.getAttribute('src')
    })));
    if (!items.length) throw new Error(`Empty service category: ${category.id}`);
    const collected = { ...category, entries: [], page: page.url() };
    report.categories.push(collected);
    await screenshot(`official-category-${category.id}`);
    const existing = local.categories.find(item => item.id === category.id);
    let nextNumber = Math.max(0, ...(existing?.entries || []).map(id => Number(id.split('-').at(-1)) || 0));
    for (const item of items) {
      const matched = existing?.entries.map(localEntry).find(entry => plainName(entry.name) === plainName(item.name));
      const id = matched?.id || `${category.id}-${String(++nextNumber).padStart(2, '0')}`;
      const entry = { id, name: item.name, parent: category.id, kind: item.mode === 'gallery' ? 'gallery' : 'single', posters: [] };
      report.entries.push(entry);
      collected.entries.push(id);
      addIcon('entry', id, item.icon, matched?.icon?.src);
      if (item.mode === 'gallery') galleryQueue.push({ entry, key: item.target });
      else if (item.mode === 'single' && item.img) singleQueue.push({ entry, path: item.img, label: item.label || item.name });
      else throw new Error(`Unsupported service card mode: ${category.id}/${item.name}/${item.mode}`);
    }
  }
  for (const { entry, path, label } of singleQueue) await singlePoster(entry, path, label);
  for (const { entry, key } of galleryQueue) await galleryPosters(entry, key);
  const jobs = [];
  for (const entry of report.entries) {
    entry.posters.forEach((poster, index) => jobs.push(async () => {
      await compareResource(poster, localPoster(entry.id, index)?.src, `poster-${entry.id}-${index + 1}`);
      poster.localPosterId = localPoster(entry.id, index)?.id || null;
    }));
  }
  for (const icon of report.icons) jobs.push(() => compareResource(icon, icon.localSrc, `icon-${icon.id}`));
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < jobs.length) {
      const index = cursor++;
      try { await jobs[index](); }
      catch (error) { report.errors.push({ type: 'resource', index, message: error.message }); }
    }
  }));
  const posters = report.entries.flatMap(entry => entry.posters);
  const differenceCounts = posters.reduce((counts, poster) => {
    counts[poster.difference || 'failed'] = (counts[poster.difference || 'failed'] || 0) + 1;
    return counts;
  }, {});
  const missingLocalEntries = local.entries.filter(entry => !report.entries.some(current => current.id === entry.id)).map(entry => entry.id);
  report.counts = { categories: report.categories.length, entries: report.entries.length,
    galleries: report.entries.filter(entry => entry.kind === 'gallery').length, posters: posters.length, ...differenceCounts };
  report.missingLocalEntries = missingLocalEntries;
  if (missingLocalEntries.length) report.errors.push({ type: 'coverage', message: `Existing entries not observed: ${missingLocalEntries.join(', ')}` });
  const fewerPosters = local.entries.filter(entry => {
    const current = report.entries.find(observed => observed.id === entry.id);
    return current && current.posters.length < entry.posters.length;
  }).map(entry => entry.id);
  if (fewerPosters.length) report.errors.push({ type: 'coverage', message: `Existing gallery images not fully observed: ${fewerPosters.join(', ')}` });
  if (report.entries.some(entry => !entry.posters.length) || posters.some(poster => !poster.sha256)) {
    report.errors.push({ type: 'coverage', message: 'An entry or image was not fully observed' });
  }
  report.complete = report.errors.length === 0;
} catch (error) {
  report.errors.push({ type: 'probe', message: error.message });
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  const changes = report.entries.flatMap(entry => entry.posters.filter(poster => poster.difference !== 'same').map(poster =>
    `| ${entry.name} | ${poster.label} | ${poster.difference || 'failed'} | ${poster.sha256?.slice(0, 12) || '-'} |`));
  await writeFile(resolve(output, 'report.md'), `# 价格页探针报告\n\n来源：${source.href}\n\n完成时间：${report.finishedAt}\n\n状态：${report.complete ? '完整' : '不完整，不可据此覆盖站点'}\n\n计数：${JSON.stringify(report.counts || {})}\n\n| 服务 | 海报 | 差异 | SHA-256 前缀 |\n| --- | --- | --- | --- |\n${changes.join('\n') || '| 全部 | 全部 | same | - |'}\n\n错误：${JSON.stringify(report.errors)}\n`);
  await context?.close();
  await browser?.close();
}
console.log(JSON.stringify({ complete: report.complete, ...report.counts, report: relative(root, resolve(output, 'report.json')), errors: report.errors }));
if (!report.complete) process.exitCode = 1;
