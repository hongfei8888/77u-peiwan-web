import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, option, launchChrome, sha256, imageSize } from './price-tools.mjs';

const origin = option('--origin', 'http://127.0.0.1:8000');
const output = resolve(root, option('--output', '_本地工作记录/sidebar-icons/2026-11-12-mature-a/validation'));
const baseline = JSON.parse(await readFile(resolve(root, option('--baseline', 'tests/fixtures/sidebar-icons-before.json')), 'utf8'));
const manifest = JSON.parse(await readFile(resolve(root, 'content/sidebar-icons.json'), 'utf8'));
const byPage = new Map(Object.entries(manifest.icons).map(([id, icon]) => [icon.page, id]));
const isNav = tag => /class="([^"]+)"/.exec(tag)?.[1].split(/\s+/).includes('nav-link');
const pageName = tag => /href="([^"]+)"/.exec(tag)?.[1].replace(/^\.\.\//, '').split(/[?#]/)[0];
function protectedHtml(html) {
  return html.replace(/<link\b[^>]*href="(?:\.\.\/)?css\/sidebar-icons\.css[^\"]*"[^>]*>/g, '')
    .replace(/(<a\b[^>]*>)([\s\S]*?)(<\/a>)/g, (match, tag, content, end) =>
      isNav(tag) && byPage.has(pageName(tag)) ? tag + content.replace(/<svg\b[\s\S]*?<\/svg>/, '<NAV-ICON/>') + end : match);
}
const result = { passed: false, startedAt: new Date().toISOString(), checks: [], pageErrors: [], resourceErrors: [], screenshots: [] };
const url = path => new URL(path, origin).href;
let browser;
await mkdir(output, { recursive: true });
try {
  let instances = 0;
  for (const [filename, original] of Object.entries(baseline.pages)) {
    const html = await readFile(resolve(root, filename), 'utf8');
    assert.equal(sha256(Buffer.from(protectedHtml(html))), original.protectedHtmlSha256, `Unrelated HTML changed: ${filename}`);
    assert.equal((html.match(/data-sidebar-icon=/g) || []).length, original.iconCount);
    const prefix = filename.startsWith('price/') ? '../' : '';
    assert.equal((html.match(/css\/sidebar-icons\.css\?v=/g) || []).length, 1);
    assert.ok(html.includes(`${prefix}${manifest.css}`));
    instances += original.iconCount;
  }
  for (const [filename, hash] of Object.entries(baseline.files)) assert.equal(sha256(await readFile(resolve(root, filename))), hash, filename);
  for (const [id, icon] of Object.entries(manifest.icons)) {
    const bytes = await readFile(resolve(root, icon.src));
    assert.equal(sha256(bytes), icon.sha256);
    assert.ok(bytes.toString('utf8').includes(`data-sidebar-icon="${id}"`));
  }
  assert.equal(instances, manifest.instanceCount);
  result.checks.push({ check: 'All existing pages covered; non-icon HTML, business content and behavior scripts unchanged', pages: manifest.pages.length, instances });

  browser = await launchChrome();
  const paths = ['index.html','activities.html','menu.html','players.html','community.html','join.html','reviews.html','contact.html','assessment.html','account.html','price/detail.html?item=run'];
  let renderedIcons = 0;
  for (const theme of ['light','dark']) {
    for (const width of [390,768,1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await context.addInitScript(theme => localStorage.setItem('qiqiyou-theme', theme), theme);
      const page = await context.newPage();
      page.on('pageerror', error => result.pageErrors.push({ page: page.url(), message: error.message }));
      page.on('response', response => {
        if (response.url().includes('/css/sidebar-icons.css') && response.status() !== 200) result.resourceErrors.push({ url: response.url(), status: response.status() });
      });
      for (const path of paths) {
        const response = await page.goto(url(path), { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200, path);
        await page.waitForFunction(() => document.querySelectorAll('.nav-links .sidebar-icon').length > 0);
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        const filename = path.split('?')[0];
        const original = baseline.pages[filename];
        const toggle = page.locator('#nav-toggle');
        const links = page.locator('.nav-links');
        const mobile = await toggle.isVisible();
        if (mobile && !await links.isVisible()) {
          await toggle.click();
          assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        }
        const panelColor = await links.evaluate(panel => getComputedStyle(panel).backgroundColor);
        if (theme === 'light') assert.equal(panelColor, 'rgb(255, 255, 255)', 'Light navigation must not retain a dark dropdown background');
        const actual = await page.locator('.nav-links .nav-link').evaluateAll(links => links.map(link => ({
          href: link.getAttribute('href'), label: link.textContent.trim(), icon: link.querySelector('[data-sidebar-icon]')?.dataset.sidebarIcon || null
        })));
        assert.deepEqual(actual, original.links.map(({href,label,icon}) => ({href,label,icon})), path);
        assert.equal(await page.locator('.nav-links .sidebar-icon').count(), original.iconCount);
        for (const icon of await page.locator('.nav-links .sidebar-icon').all()) {
          assert.equal(await icon.getAttribute('aria-hidden'), 'true');
          assert.equal(await icon.getAttribute('focusable'), 'false');
          const visual = await icon.evaluate(svg => ({ width: svg.getBoundingClientRect().width, height: svg.getBoundingClientRect().height,
            stroke: getComputedStyle(svg).stroke, primitiveCount: svg.querySelectorAll('path,rect,circle').length,
            hasColor: [...svg.querySelectorAll('[fill],[stroke]')].some(el => /sidebar-icon-(blue|teal|gold)/.test((el.getAttribute('fill') || '') + (el.getAttribute('stroke') || ''))) }));
          assert.equal(visual.width, 22);
          assert.equal(visual.height, 22);
          assert.equal(visual.stroke, theme === 'light' ? 'rgb(49, 59, 75)' : 'rgb(196, 206, 219)');
          assert.ok(visual.primitiveCount > 0 && visual.hasColor);
          renderedIcons++;
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Overflow: ${path}/${width}`);
        if (path === 'index.html') {
          await page.evaluate(() => document.fonts.ready);
          const name = `sidebar-${theme}-${width}.png`;
          if (mobile) await page.screenshot({ path: resolve(output, name) });
          else await page.screenshot({ path: resolve(output, name), clip: { x: 0, y: 0, width: 216, height: 640 } });
          const size = imageSize(await readFile(resolve(output, name)));
          assert.ok(size.height >= 640);
          result.screenshots.push(name);
          if (mobile) {
            await page.keyboard.press('Escape');
            assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
            assert.equal(await toggle.evaluate(button => button === document.activeElement), true);
          }
        }
        result.checks.push({ page: path, theme, width, icons: original.iconCount, mobile });
      }
      await context.close();
    }
  }
  result.checks.push({ check: 'Rendered icon visibility, semantic colors, theme contrast and responsive geometry', renderedIcons });

  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url('index.html'), { waitUntil: 'domcontentloaded' });
  await page.locator('#nav-toggle').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.nav-links .nav-link').first().evaluate(link => link === document.activeElement), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'), 'false');
  await page.locator('#theme-toggle').click();
  await page.locator('#nav-toggle').click();
  assert.equal(await page.locator('.nav-links .sidebar-icon').first().evaluate(svg => getComputedStyle(svg).stroke),
    await page.locator('html').getAttribute('data-theme') === 'light' ? 'rgb(49, 59, 75)' : 'rgb(196, 206, 219)');
  await page.locator('.nav-links a[href="menu.html"] svg').click();
  await page.waitForURL('**/menu.html');
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'), 'false');
  await context.close();
  result.checks.push({ check: 'Mobile keyboard open/tab/escape, live theme switch and SVG pointer click navigation' });

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(url('index.html'), { waitUntil: 'load' });
  assert.equal(await noJsPage.locator('.nav-links .sidebar-icon').count(), 8);
  assert.equal(await noJsPage.locator('.nav-links .sidebar-icon').first().isVisible(), true);
  for (const icon of Object.values(manifest.icons)) assert.equal((await noJs.request.get(url(icon.src))).status(), 200);
  await noJs.close();
  result.checks.push({ check: 'No-JavaScript rendering and eight standalone SVG resources' });
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.resourceErrors, []);
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
