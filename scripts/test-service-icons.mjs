import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, option, launchChrome, sha256, imageSize, waitForImage } from './price-tools.mjs';

const origin = option('--origin', 'http://127.0.0.1:8000');
const output = resolve(root, option('--output', '_本地工作记录/icon-assets/2026-11-12-game-items/validation'));
const manifest = JSON.parse(await readFile(resolve(root, 'content/service-icons.json'), 'utf8'));
const baseline = JSON.parse(await readFile(resolve(root, option('--baseline', 'tests/fixtures/service-icons-before.json')), 'utf8'));
const result = { passed: false, errors: [], checks: [], screenshots: [], startedAt: new Date().toISOString() };
const absolute = path => new URL(path, origin).href;
await mkdir(output, { recursive: true });
let browser;
try {
  assert.equal(Object.keys(manifest.icons).length, 7);
  let totalBytes = 0;
  for (const icon of Object.values(manifest.icons)) {
    const bytes = await readFile(resolve(root, icon.src));
    assert.equal(sha256(bytes), icon.sha256);
    assert.deepEqual(imageSize(bytes), { width: 192, height: 192 });
    assert.ok(icon.transparentPixels > 1000);
    assert.ok(bytes.length < 50000);
    totalBytes += bytes.length;
  }
  for (const [filename, hash] of Object.entries(baseline.files)) assert.equal(sha256(await readFile(resolve(root, filename))), hash, `Unrelated content changed: ${filename}`);
  result.checks.push({ check: 'Seven local transparent WebP assets and unchanged business content', totalBytes });
  browser = await launchChrome();
  let imageChecks = 0;
  for (const theme of ['light', 'dark']) {
    for (const width of [390,768,1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      await context.addInitScript(theme => localStorage.setItem('qiqiyou_theme', theme), theme);
      const page = await context.newPage();
      page.on('pageerror', error => result.errors.push({ type: 'page', message: error.message }));
      page.on('console', message => { if (message.type() === 'error') result.errors.push({ type: 'console', message: message.text() }); });
      page.on('response', response => { if (response.status() >= 400 && new URL(response.url()).origin === new URL(origin).origin) result.errors.push({ type: 'http', url: response.url(), status: response.status() }); });
      for (const filename of ['index.html','home.html','menu.html']) {
        const response = await page.goto(absolute(filename), { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200);
        await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
        const cards = await page.locator('.price-menu-grid > a').evaluateAll(cards => cards.map(card => ({
          id: card.id, href: card.getAttribute('href'), text: card.textContent.replace(/\s+/g,' ').trim(),
          portrait: card.querySelector('.price-service-icon')?.getAttribute('src') || null
        })));
        assert.deepEqual(cards, baseline.pages[filename], `Menu labels, links or existing portraits changed: ${filename}`);
        const expected = Object.keys(manifest.icons).filter(id => baseline.pages[filename].some(card => card.id === `menu-link-${id}`));
        assert.equal(await page.locator('.game-item-icon').count(), expected.length);
        for (const id of expected) {
          const selector = `#menu-link-${id} .game-item-icon`;
          const icon = page.locator(selector);
          await icon.scrollIntoViewIfNeeded();
          const image = await waitForImage(page, selector);
          assert.equal(image.url, absolute(manifest.icons[id].src));
          assert.equal(image.width, 192);
          assert.equal(await icon.getAttribute('alt'), '');
          const rendering = await icon.evaluate(image => {
            const rect = image.getBoundingClientRect(), slot = image.parentElement;
            return { width: rect.width, height: rect.height, background: getComputedStyle(slot).backgroundColor, svgCount: slot.querySelectorAll('svg').length };
          });
          assert.equal(rendering.width, width <= 768 ? 38 : 48, `${filename}/${theme}/${width}/${id}`);
          assert.equal(rendering.height, rendering.width);
          assert.equal(rendering.background, 'rgba(0, 0, 0, 0)');
          assert.equal(rendering.svgCount, 0);
          imageChecks++;
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Overflow: ${filename}/${theme}/${width}`);
        if (filename === 'menu.html') {
          await page.evaluate(() => document.fonts.ready);
          await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok))));
          const screenshot = `menu-icons-${theme}-${width}.png`;
          await page.locator('.price-menu-grid').screenshot({ path: resolve(output, screenshot), animations: 'disabled' });
          const size = imageSize(await readFile(resolve(output, screenshot)));
          assert.ok(size.height > 400, 'Screenshot must include the complete service grid');
          result.screenshots.push(screenshot);
        }
        result.checks.push({ page: filename, theme, width, icons: expected.length, contentPreserved: true });
      }
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const id of Object.keys(manifest.icons)) {
    await page.goto(absolute('menu.html'), { waitUntil: 'domcontentloaded' });
    const link = page.locator(`#menu-link-${id}`);
    await link.focus();
    assert.equal(await link.evaluate(link => link === document.activeElement && getComputedStyle(link).outlineStyle !== 'none'), true);
    await page.keyboard.press('Enter');
    await page.waitForURL(`**/price/detail.html?item=${id}`);
    await waitForImage(page, '.poster-image');
    assert.equal(await page.locator('#poster-page-title').innerText(), {
      run: '跑刀/陪跑', 'sweet-day': '甜蜜包天(娱乐)', 'assault-day': '包天猛攻(技术)',
      'other-games': '其他游戏陪玩', 'season-3x3': '赛季3×3代肝', gifts: '礼物打赏单', prepaid: '充值预存'
    }[id]);
  }
  await context.close();
  assert.equal(imageChecks, 108);
  assert.deepEqual(result.errors, []);
  result.checks.push({ check: 'Keyboard focus and existing detail links', links: 7, imageChecks });
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
