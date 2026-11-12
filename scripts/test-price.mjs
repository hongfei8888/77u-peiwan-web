import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, option, launchChrome, readMenu, sha256, imageSize, waitForImage } from './price-tools.mjs';

const origin = option('--origin', 'http://127.0.0.1:8000');
const evidence = resolve(root, option('--report', 'tests/fixtures/price-sync/report.json'));
const output = resolve(root, option('--output', '_本地工作记录/price-sync/2026-11-11-validation'));
const source = JSON.parse(await readFile(evidence, 'utf8'));
const baseline = JSON.parse(await readFile(resolve(evidence, '../local-menu.json'), 'utf8'));
const data = readMenu();
const rights = JSON.parse(await readFile(resolve(root, 'content/owner-rights.json'), 'utf8'));
const result = { passed: false, startedAt: new Date().toISOString(), checks: [], pageErrors: [], consoleErrors: [], networkErrors: [], screenshots: [] };
let browser;
let expectedImageFailure = false;
await mkdir(output, { recursive: true });
const url = path => new URL(path, origin).href;
const record = (name, detail = {}) => result.checks.push({ name, ...detail });
const posterFor = (entry, index) => data.posters.find(poster => poster.id === entry.posters[index].id);

function observe(page) {
  page.on('pageerror', error => result.pageErrors.push({ url: page.url(), message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error' && !expectedImageFailure) result.consoleErrors.push({ url: page.url(), message: message.text() });
  });
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(origin).origin && !expectedImageFailure) {
      result.networkErrors.push({ url: response.url(), status: response.status() });
    }
  });
}
async function goto(page, path) {
  const response = await page.goto(url(path), { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, path);
}
async function noOverflow(page) {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(sizes.document <= sizes.viewport + 1, `Overflow at ${page.url()}: ${JSON.stringify(sizes)}`);
}
async function capture(page, filename, scriptEnabled = true) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all([...document.images].filter(image => {
      const rect = image.getBoundingClientRect();
      return image.complete && image.naturalWidth > 0 && rect.top < innerHeight && rect.bottom > 0;
    }).map(image => image.decode ? image.decode().catch(() => {}) : Promise.resolve()));
  });
  if (scriptEnabled) await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: resolve(output, filename), fullPage: false });
  result.screenshots.push(filename);
}
async function checkImage(page, entry, index) {
  const poster = posterFor(entry, index);
  const observed = await waitForImage(page, '.poster-image');
  assert.equal(observed.url, url(poster.displaySrc || poster.src), `${entry.id}/${index}`);
  const dimensions = await page.locator('.poster-image').evaluate(img => ({
    width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
    declaredWidth: img.getAttribute('width'), declaredHeight: img.getAttribute('height'), alt: img.alt
  }));
  assert.equal(await page.locator('.poster-image').isVisible(), true);
  assert.ok(dimensions.alt.length > 0);
  assert.equal(Number(dimensions.declaredWidth), poster.width);
  assert.equal(Number(dimensions.declaredHeight), poster.height);
  assert.ok(Math.abs(dimensions.height - dimensions.width * dimensions.naturalHeight / dimensions.naturalWidth) < 2, `Distorted poster: ${entry.id}/${index}`);
}

try {
  assert.equal(source.complete, true);
  assert.deepEqual([data.categories.length, data.entries.length, data.entries.filter(entry => entry.kind === 'gallery').length, data.posters.length], [3,34,8,50]);
  for (const old of baseline.entries) {
    const current = data.entries.find(entry => entry.id === old.id);
    assert.ok(current, `Removed entry ${old.id}`);
    old.posters.forEach((poster, index) => assert.equal(current.posters[index].id, poster.id, `Changed old poster ID: ${old.id}/${index}`));
  }
  for (const entry of source.entries) {
    const current = data.entries.find(existing => existing.id === entry.id);
    assert.equal(current.posters.length, entry.posters.length);
    for (let index = 0; index < entry.posters.length; index++) {
      const poster = posterFor(current, index);
      const bytes = await readFile(resolve(root, poster.src));
      assert.equal(sha256(bytes), entry.posters[index].sha256, `${entry.id}/${index} file content`);
      assert.deepEqual(imageSize(bytes), { width: poster.width, height: poster.height });
      assert.equal(poster.source.url, entry.posters[index].url);
      if (poster.displaySrc) await readFile(resolve(root, poster.displaySrc));
    }
  }
  record('Source coverage, hashes, dimensions and old IDs', { categories: 3, entries: 34, galleries: 8, posters: 50 });
  assert.equal(posterFor(data.entries.find(entry => entry.id === 'gifts'), 0).displaySrc,
    baseline.posters.find(poster => poster.id === 'poster-5').displaySrc);
  record('Unchanged local branded image preserved');

  browser = await launchChrome();
  for (const width of [390,768,1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    observe(page);
    for (const path of ['/', '/home.html', '/menu.html']) {
      await goto(page, path);
      assert.equal(await page.locator('#menu-link-laotai').count(), 1);
      assert.equal(await page.locator('#menu-link-double-fun').count(), 1);
      assert.equal(await page.locator('.price-menu-grid .poster-menu-card--compact').count(), 6);
      assert.equal(await page.locator('.price-menu-grid .poster-menu-card--feature').count(), 2);
      await noOverflow(page);
      if (path === '/menu.html') {
        const texts = await page.locator('.menu-rights-list li').evaluateAll(items => items.map(item => ({
          title: item.querySelector('h3').textContent, text: item.querySelector('p').textContent
        })));
        assert.deepEqual(texts, rights.rules);
        assert.equal(await page.locator('#menu-rights-original').getAttribute('href'), 'price/detail.html?item=benefits');
        const cards = await page.locator('.price-menu-grid .poster-menu-card--compact').evaluateAll(items => items.map(item => ({
          x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y
        })));
        const firstRow = cards.filter(card => Math.abs(card.y - cards[0].y) < 2);
        assert.equal(firstRow.length, width <= 768 ? 2 : 3);
      }
      await capture(page, `${path === '/' ? 'index' : path.slice(1).replace('.html', '')}-${width}.png`);
    }
    for (const category of data.categories) {
      await goto(page, `/price/detail.html?category=${category.id}`);
      assert.equal(await page.locator('#poster-page-title').innerText(), `${category.name} · 服务分区`);
      const links = await page.locator('#poster-content .poster-menu-card').evaluateAll(items => items.map(item => item.getAttribute('href')));
      assert.equal(links.length, category.entries.length);
      category.entries.forEach((id, index) => assert.equal(links[index], url(`/price/detail.html?item=${id}`)));
      await noOverflow(page);
      if (category.id === 'laotai') await capture(page, `laotai-${width}.png`);
    }
    let visited = 0;
    for (const entry of data.entries) {
      await goto(page, `/price/detail.html?item=${entry.id}`);
      const parent = data.categories.find(category => category.id === entry.parent);
      const prefix = parent ? ({pc:'端游',mobile:'手游'}[parent.id] || parent.name) + ' · ' : '';
      assert.equal(await page.locator('#poster-page-title').innerText(), prefix + entry.name);
      assert.equal(await page.getByRole('tab').count(), entry.posters.length > 1 ? entry.posters.length : 0);
      for (let index = 0; index < entry.posters.length; index++) {
        if (entry.posters.length > 1) {
          await page.getByRole('tab').nth(index).click();
          assert.equal(await page.getByRole('tab').nth(index).getAttribute('aria-selected'), 'true');
          assert.equal(await page.getByRole('tab').nth(index).getAttribute('tabindex'), '0');
        }
        await checkImage(page, entry, index);
        await noOverflow(page);
        visited++;
      }
      if (entry.id === 'pc-07') await capture(page, `pc-fun-tab5-${width}.png`);
      if (entry.id === 'pc-02') await capture(page, `pc-play-black-tide-${width}.png`);
      if (entry.id === 'double-fun') await capture(page, `double-fun-${width}.png`);
    }
    assert.equal(visited, 50);
    record(`Responsive service traversal ${width}px`, { entries: 34, images: visited, overflow: false });
    await context.close();
    console.log(`Responsive traversal passed: ${width}px / ${visited} posters`);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 720 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  observe(page);
  const fun = data.entries.find(entry => entry.id === 'pc-07');
  await goto(page, '/price/detail.html?item=pc-07&tab=5');
  await checkImage(page, fun, 4);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await checkImage(page, fun, 4);
  await page.getByRole('tab').nth(4).focus();
  for (const [key, index] of [['Home',0],['End',4],['ArrowRight',0],['ArrowLeft',4]]) {
    await page.keyboard.press(key);
    await checkImage(page, fun, index);
    assert.equal(await page.getByRole('tab').nth(index).getAttribute('aria-selected'), 'true');
    assert.equal(await page.getByRole('tab').nth(index).evaluate(tab => tab === document.activeElement), true);
  }
  for (const value of ['0','99','invalid','-1']) {
    await goto(page, `/price/detail.html?item=pc-07&tab=${value}`);
    await checkImage(page, fun, 0);
  }
  record('Deep links, refresh, keyboard navigation, tab boundaries and selected focus');

  await goto(page, '/menu.html');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForFunction(() => Math.abs(scrollY - 200) < 3);
  const position = await page.evaluate(() => scrollY);
  await page.locator('#menu-link-double-fun').click();
  await page.waitForURL('**/price/detail.html?item=double-fun');
  await checkImage(page, data.entries.find(entry => entry.id === 'double-fun'), 0);
  assert.equal(await page.locator('#poster-back').innerText(), '← 返回玩法菜单');
  await page.locator('#poster-back').click();
  await page.waitForURL('**/menu.html');
  await page.waitForFunction(y => Math.abs(scrollY - y) < 4, position);
  assert.equal(await page.locator('#menu-link-double-fun').evaluate(link => link === document.activeElement), true);
  await page.goForward({ waitUntil: 'domcontentloaded' });
  assert.ok(page.url().endsWith('item=double-fun'));
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.locator('#menu-link-laotai').click();
  await page.waitForURL('**/price/detail.html?category=laotai');
  await page.locator('#menu-link-laotai-02').click();
  await page.waitForURL('**/price/detail.html?item=laotai-02');
  assert.equal(await page.locator('#poster-back').innerText(), '← 返回分类');
  await page.locator('#poster-back').click();
  await page.waitForURL('**/price/detail.html?category=laotai');
  record('Menu return scroll/focus, browser forward/back and nested category return');

  const run = data.entries.find(entry => entry.id === 'run');
  const failedUrl = url(posterFor(run, 0).src);
  expectedImageFailure = true;
  await page.route(failedUrl, route => route.abort());
  await goto(page, '/price/detail.html?item=run');
  await page.locator('.poster-error').waitFor({ state: 'visible' });
  await capture(page, 'image-error-retry.png');
  await page.unroute(failedUrl);
  await page.getByRole('button', { name: '重新加载' }).click();
  await checkImage(page, run, 0);
  assert.equal(await page.locator('.poster-error').isHidden(), true);
  expectedImageFailure = false;
  record('Image failure and successful retry');
  await goto(page, '/price/detail.html?item=missing-service');
  assert.equal(await page.locator('#poster-page-title').innerText(), '未找到这个玩法');
  assert.equal(await page.locator('.poster-invalid a').getAttribute('href'), url('/menu.html#menu'));
  record('Invalid service link recovery');
  await context.close();

  const normal = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'no-preference' });
  const motionPage = await normal.newPage();
  observe(motionPage);
  await goto(motionPage, '/menu.html');
  await motionPage.locator('#menu-link-laotai').click();
  await motionPage.waitForURL('**/price/detail.html?category=laotai');
  await motionPage.locator('#menu-link-laotai-01').click();
  await motionPage.waitForURL('**/price/detail.html?item=laotai-01');
  await checkImage(motionPage, data.entries.find(entry => entry.id === 'laotai-01'), 0);
  await noOverflow(motionPage);
  record('Normal-motion mobile navigation');
  await normal.close();

  const noJsContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  const noJsPage = await noJsContext.newPage();
  await goto(noJsPage, '/price/detail.html');
  const fallbackLinks = await noJsPage.locator('.poster-noscript a').evaluateAll(links => links.map(link => link.href));
  assert.equal(fallbackLinks.length, 50);
  for (const href of fallbackLinks) assert.equal((await noJsContext.request.get(href)).status(), 200);
  await noOverflow(noJsPage);
  await capture(noJsPage, 'noscript-390.png', false);
  record('No-JavaScript fallback', { links: fallbackLinks.length });
  await noJsContext.close();

  const beforeHash = sha256(await readFile(resolve(root, 'js/poster-menu.generated.js')));
  let failed = false;
  try {
    execFileSync(process.execPath, [resolve(root, 'scripts/probe-price.mjs'), '--source', 'http://127.0.0.1:1/price/index.html', '--output', resolve(output, 'incomplete-probe'), '--no-screenshots'], { cwd: root, timeout: 45000, stdio: 'pipe' });
  } catch (error) { failed = error.status === 1; }
  assert.equal(failed, true, 'Incomplete probe must fail');
  const incomplete = JSON.parse(await readFile(resolve(output, 'incomplete-probe/report.json'), 'utf8'));
  assert.equal(incomplete.complete, false);
  let applyRejected = false;
  try {
    execFileSync(process.execPath, [resolve(root, 'scripts/sync-price-snapshot.mjs'), '--report', resolve(output, 'incomplete-probe/report.json')], { cwd: root, timeout: 10000, stdio: 'pipe' });
  } catch (error) { applyRejected = error.status === 1; }
  assert.equal(applyRejected, true);
  assert.equal(sha256(await readFile(resolve(root, 'js/poster-menu.generated.js'))), beforeHash);
  record('Incomplete snapshot rejected without modifying website content');

  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.consoleErrors, []);
  assert.deepEqual(result.networkErrors, []);
  result.passed = true;
} catch (error) {
  result.error = { message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  await browser?.close();
  result.finishedAt = new Date().toISOString();
  await writeFile(resolve(output, 'validation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ passed: result.passed, checks: result.checks.length, screenshots: result.screenshots.length, error: result.error?.message, report: resolve(output, 'validation.json') }));
}
